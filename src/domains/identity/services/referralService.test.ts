import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma before importing the service
vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    referral: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    user: { update: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { prisma } from "@/lib/db/prisma";
import {
  getOrCreateReferralCode,
  applyReferralCode,
  completeReferral,
  getReferralStats,
} from "./referralService";

const mockReferral = prisma.referral as ReturnType<typeof vi.mocked<typeof prisma.referral>>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getOrCreateReferralCode", () => {
  it("returns existing code when one exists", async () => {
    vi.mocked(mockReferral.findFirst).mockResolvedValueOnce({ code: "ABC12345" } as never);

    const code = await getOrCreateReferralCode("user-1");

    expect(code).toBe("ABC12345");
    expect(mockReferral.create).not.toHaveBeenCalled();
  });

  it("creates a new code when none exists", async () => {
    vi.mocked(mockReferral.findFirst).mockResolvedValueOnce(null);
    vi.mocked(mockReferral.create).mockResolvedValueOnce({ code: "NEWCODE1" } as never);

    const code = await getOrCreateReferralCode("user-2");

    expect(code).toBe("NEWCODE1");
    expect(mockReferral.create).toHaveBeenCalledOnce();
  });

  it("retries on code collision and succeeds on second attempt", async () => {
    vi.mocked(mockReferral.findFirst).mockResolvedValueOnce(null);
    vi.mocked(mockReferral.create)
      .mockRejectedValueOnce(new Error("Unique constraint"))
      .mockResolvedValueOnce({ code: "RETRY123" } as never);

    const code = await getOrCreateReferralCode("user-3");

    expect(code).toBe("RETRY123");
    expect(mockReferral.create).toHaveBeenCalledTimes(2);
  });

  it("throws after 5 failed attempts", async () => {
    vi.mocked(mockReferral.findFirst).mockResolvedValueOnce(null);
    vi.mocked(mockReferral.create).mockRejectedValue(new Error("Unique constraint"));

    await expect(getOrCreateReferralCode("user-4")).rejects.toThrow(
      "Failed to generate unique referral code after 5 attempts"
    );
    expect(mockReferral.create).toHaveBeenCalledTimes(5);
  });
});

describe("applyReferralCode", () => {
  it("returns false when code does not exist", async () => {
    vi.mocked(mockReferral.findUnique).mockResolvedValueOnce(null);

    expect(await applyReferralCode("BADCODE", "user-1")).toBe(false);
  });

  it("returns false when code already has a referee", async () => {
    vi.mocked(mockReferral.findUnique).mockResolvedValueOnce({
      code: "ABC12345", referrerId: "referrer-1", refereeId: "existing-user",
    } as never);

    expect(await applyReferralCode("ABC12345", "user-1")).toBe(false);
  });

  it("returns false when user tries to use their own code", async () => {
    vi.mocked(mockReferral.findUnique).mockResolvedValueOnce({
      code: "MYCODE12", referrerId: "user-1", refereeId: null,
    } as never);

    expect(await applyReferralCode("MYCODE12", "user-1")).toBe(false);
  });

  it("applies the code and returns true", async () => {
    vi.mocked(mockReferral.findUnique).mockResolvedValueOnce({
      code: "VALID123", referrerId: "referrer-1", refereeId: null,
    } as never);
    vi.mocked(mockReferral.update).mockResolvedValueOnce({} as never);

    expect(await applyReferralCode("VALID123", "user-new")).toBe(true);
    expect(mockReferral.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { code: "VALID123" }, data: { refereeId: "user-new" } })
    );
  });
});

describe("completeReferral", () => {
  it("does nothing when no referral exists for referee", async () => {
    vi.mocked(mockReferral.findUnique).mockResolvedValueOnce(null);

    await completeReferral("no-referral-user");

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing when referral status is not pending", async () => {
    vi.mocked(mockReferral.findUnique).mockResolvedValueOnce({
      id: "ref-1", referrerId: "referrer-1", status: "rewarded",
    } as never);

    await completeReferral("referee-1");

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("completes referral and awards Pro trial to both parties", async () => {
    vi.mocked(mockReferral.findUnique).mockResolvedValueOnce({
      id: "ref-1", referrerId: "referrer-1", status: "pending",
    } as never);
    vi.mocked(prisma.$transaction).mockResolvedValueOnce([] as never);

    await completeReferral("referee-1");

    expect(prisma.$transaction).toHaveBeenCalledOnce();
    const txArg = vi.mocked(prisma.$transaction).mock.calls[0][0];
    expect(Array.isArray(txArg) ? txArg : [txArg]).toHaveLength(3);
  });
});

describe("getReferralStats", () => {
  it("returns stats with existing referrals", async () => {
    vi.mocked(mockReferral.findMany).mockResolvedValueOnce([
      { code: "CODE1234", status: "rewarded", refereeId: "user-a" },
      { code: "CODE1234", status: "pending", refereeId: "user-b" },
      { code: "CODE1234", status: "pending", refereeId: null },
    ] as never);

    const stats = await getReferralStats("user-1");

    expect(stats.code).toBe("CODE1234");
    expect(stats.totalInvited).toBe(2);
    expect(stats.totalCompleted).toBe(1);
  });

  it("generates a new code when no referrals exist", async () => {
    vi.mocked(mockReferral.findMany).mockResolvedValueOnce([] as never);
    vi.mocked(mockReferral.findFirst).mockResolvedValueOnce(null);
    vi.mocked(mockReferral.create).mockResolvedValueOnce({ code: "FRESH123" } as never);

    const stats = await getReferralStats("user-new");

    expect(stats.code).toBe("FRESH123");
    expect(stats.totalInvited).toBe(0);
    expect(stats.totalCompleted).toBe(0);
  });
});
