import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit/auditService";
import {
  submitApplication,
  withdrawApplication,
  firstMissingField,
  MIN_BIO_LENGTH,
} from "@/domains/marketplace/services/coachApplicationService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachProfile: { findUnique: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
  },
}));
vi.mock("@/lib/audit/auditService", () => ({ audit: vi.fn() }));

const mockPrisma = vi.mocked(prisma, true);

const COMPLETE = {
  id: "profile-1",
  status: "DRAFT" as const,
  displayName: "Rekkles",
  headline: "Challenger ADC, 8 years",
  bio: "x".repeat(MIN_BIO_LENGTH),
  languages: ["en"],
  regions: ["EUW"],
  roles: ["BOTTOM"],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.coachProfile.update.mockResolvedValue({} as never);
});

describe("firstMissingField", () => {
  it("passes a complete profile", () => {
    expect(firstMissingField(COMPLETE)).toBeNull();
  });

  it("reports fields in the order the form asks for them", () => {
    expect(firstMissingField({ ...COMPLETE, displayName: "  " })).toMatch(/display name/i);
    expect(firstMissingField({ ...COMPLETE, headline: "" })).toMatch(/headline/i);
    expect(firstMissingField({ ...COMPLETE, bio: "too short" })).toMatch(/at least/i);
    expect(firstMissingField({ ...COMPLETE, languages: [] })).toMatch(/language/i);
    expect(firstMissingField({ ...COMPLETE, regions: [] })).toMatch(/region/i);
    expect(firstMissingField({ ...COMPLETE, roles: [] })).toMatch(/role/i);
  });

  it("does not count whitespace toward the bio minimum", () => {
    expect(firstMissingField({ ...COMPLETE, bio: " ".repeat(500) })).toMatch(/at least/i);
  });
});

describe("submitApplication", () => {
  it("moves a complete draft into review and records who submitted it", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(COMPLETE as never);

    const result = await submitApplication("user-1");

    expect(result).toEqual({ ok: true });
    expect(mockPrisma.coachProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "profile-1" },
        data: expect.objectContaining({ status: "PENDING" }),
      })
    );
    expect(audit).toHaveBeenCalledWith(
      expect.objectContaining({ action: "coach.application.submitted", resourceId: "profile-1" })
    );
  });

  // A resubmitted application must not show the reviewer last round's note as
  // if it belonged to this one.
  it("clears the previous decision on resubmission", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...COMPLETE,
      status: "REJECTED",
    } as never);

    await submitApplication("user-1");

    expect(mockPrisma.coachProfile.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ reviewNote: null, reviewedAt: null }),
      })
    );
  });

  it("refuses when there is no profile at all", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(null as never);

    expect(await submitApplication("user-1")).toEqual({ ok: false, reason: "no-profile" });
    expect(mockPrisma.coachProfile.update).not.toHaveBeenCalled();
  });

  it("refuses a second submission while one is already in review", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...COMPLETE,
      status: "PENDING",
    } as never);

    expect(await submitApplication("user-1")).toEqual({ ok: false, reason: "already-submitted" });
  });

  it("refuses an already-approved coach", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...COMPLETE,
      status: "APPROVED",
    } as never);

    expect(await submitApplication("user-1")).toEqual({ ok: false, reason: "already-submitted" });
  });

  it("does not let a suspended coach reapply their way back in", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...COMPLETE,
      status: "SUSPENDED",
    } as never);

    expect(await submitApplication("user-1")).toEqual({ ok: false, reason: "suspended" });
    expect(mockPrisma.coachProfile.update).not.toHaveBeenCalled();
  });

  it("refuses an incomplete draft and says what is missing", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue({
      ...COMPLETE,
      bio: "short",
    } as never);

    const result = await submitApplication("user-1");

    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ reason: "incomplete" });
    expect(mockPrisma.coachProfile.update).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });
});

describe("withdrawApplication", () => {
  it("only pulls back an application nobody has decided on", async () => {
    mockPrisma.coachProfile.updateMany.mockResolvedValue({ count: 1 } as never);

    expect(await withdrawApplication("user-1")).toBe(true);
    expect(mockPrisma.coachProfile.updateMany).toHaveBeenCalledWith({
      where: { userId: "user-1", status: "PENDING" },
      data: { status: "DRAFT", submittedAt: null },
    });
  });

  it("is a no-op when there is nothing pending", async () => {
    mockPrisma.coachProfile.updateMany.mockResolvedValue({ count: 0 } as never);

    expect(await withdrawApplication("user-1")).toBe(false);
  });
});
