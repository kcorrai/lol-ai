import { describe, it, expect, beforeEach, vi } from "vitest";
import { prisma } from "@/lib/db/prisma";
import {
  checkRank,
  refreshStaleBadges,
} from "@/domains/marketplace/services/rankVerificationService";

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    coachProfile: { findUnique: vi.fn() },
    riotAccount: { findFirst: vi.fn() },
    rankedHistory: { findFirst: vi.fn(), findMany: vi.fn() },
    coachRankProof: { upsert: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockPrisma = vi.mocked(prisma, true);

const PROOF_ROW = {
  method: "PLATFORM_CHECKED" as const,
  tier: "GOLD" as const,
  division: "II" as const,
  leaguePoints: 71,
  peakTier: "GOLD" as const,
  peakDivision: "II" as const,
  checkedAt: new Date("2026-08-17T12:00:00.000Z"),
  staleAt: new Date("2026-08-19T00:00:00.000Z"),
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.coachProfile.findUnique.mockResolvedValue({ id: "profile-1" } as never);
  mockPrisma.riotAccount.findFirst.mockResolvedValue({ id: "riot-1" } as never);
  mockPrisma.rankedHistory.findFirst.mockResolvedValue({
    tier: "GOLD",
    division: "II",
    lp: 71,
  } as never);
  mockPrisma.rankedHistory.findMany.mockResolvedValue([] as never);
  mockPrisma.coachRankProof.upsert.mockResolvedValue(PROOF_ROW as never);
});

describe("checkRank", () => {
  it("records the rank it read, as PLATFORM_CHECKED", async () => {
    const result = await checkRank("user-1", "riot-1");

    expect(result.ok).toBe(true);
    expect(mockPrisma.coachRankProof.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          method: "PLATFORM_CHECKED",
          tier: "GOLD",
          division: "II",
          leaguePoints: 71,
        }),
      })
    );
  });

  // The asymmetry that makes the badge worth anything: the coach picks an
  // account, and cannot supply a rank.
  it("takes the rank only from our own stored snapshots", async () => {
    await checkRank("user-1", "riot-1");

    expect(mockPrisma.rankedHistory.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { riotAccountId: "riot-1", queueType: "RANKED_SOLO_5x5" },
        orderBy: { recordedAt: "desc" },
      })
    );
  });

  it("refuses an account the caller does not own", async () => {
    mockPrisma.riotAccount.findFirst.mockResolvedValue(null as never);

    expect(await checkRank("user-1", "somebody-elses")).toEqual({
      ok: false,
      reason: "not-owned",
    });
    expect(mockPrisma.coachRankProof.upsert).not.toHaveBeenCalled();
  });

  it("refuses when the caller is not a coach", async () => {
    mockPrisma.coachProfile.findUnique.mockResolvedValue(null as never);

    expect(await checkRank("user-1", "riot-1")).toEqual({ ok: false, reason: "no-profile" });
    expect(mockPrisma.riotAccount.findFirst).not.toHaveBeenCalled();
  });

  it("refuses rather than inventing a rank when nothing has been synced", async () => {
    mockPrisma.rankedHistory.findFirst.mockResolvedValue(null as never);

    expect(await checkRank("user-1", "riot-1")).toEqual({ ok: false, reason: "no-rank" });
    expect(mockPrisma.coachRankProof.upsert).not.toHaveBeenCalled();
  });

  it("stamps a staleAt in the future so a sweep can find it", async () => {
    await checkRank("user-1", "riot-1");

    const call = mockPrisma.coachRankProof.upsert.mock.calls[0][0] as {
      update: { checkedAt: Date; staleAt: Date };
    };
    expect(call.update.staleAt.getTime()).toBeGreaterThan(call.update.checkedAt.getTime());
  });

  describe("peak", () => {
    // Ordered in code, not in SQL: the ladder is not alphabetical and divisions
    // run backwards, so `ORDER BY tier, division` would report Silver over Gold.
    it("takes the highest rank ever recorded, not the most recent", async () => {
      mockPrisma.rankedHistory.findFirst.mockResolvedValue({
        tier: "SILVER",
        division: "II",
        lp: 84,
      } as never);
      mockPrisma.rankedHistory.findMany.mockResolvedValue([
        { tier: "GOLD", division: "III", lp: 45 },
        { tier: "GOLD", division: "II", lp: 71 },
        { tier: "SILVER", division: "II", lp: 84 },
      ] as never);

      await checkRank("user-1", "riot-1");

      expect(mockPrisma.coachRankProof.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({
            tier: "SILVER",
            peakTier: "GOLD",
            peakDivision: "II",
          }),
        })
      );
    });

    it("falls back to the current rank when there is no history to compare", async () => {
      await checkRank("user-1", "riot-1");

      expect(mockPrisma.coachRankProof.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ peakTier: "GOLD", peakDivision: "II" }),
        })
      );
    });
  });
});

describe("refreshStaleBadges", () => {
  it("only picks up badges that have actually gone stale", async () => {
    mockPrisma.coachRankProof.findMany.mockResolvedValue([] as never);

    await refreshStaleBadges();

    expect(mockPrisma.coachRankProof.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          staleAt: { lte: expect.any(Date) },
          method: "PLATFORM_CHECKED",
        }),
        orderBy: { staleAt: "asc" },
      })
    );
  });

  it("works the oldest first and stops at the batch ceiling", async () => {
    mockPrisma.coachRankProof.findMany.mockResolvedValue([] as never);

    await refreshStaleBadges(50);

    expect(mockPrisma.coachRankProof.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 50 })
    );
  });

  it("counts what it refreshed and what it could not", async () => {
    mockPrisma.coachRankProof.findMany.mockResolvedValue([
      { riotAccountId: "riot-1", coachProfile: { userId: "user-1" } },
      { riotAccountId: "riot-2", coachProfile: { userId: "user-2" } },
    ] as never);
    // The second account has nothing synced, so its check cannot succeed.
    mockPrisma.rankedHistory.findFirst
      .mockResolvedValueOnce({ tier: "GOLD", division: "II", lp: 71 } as never)
      .mockResolvedValueOnce(null as never);

    expect(await refreshStaleBadges()).toEqual({ checked: 1, failed: 1 });
  });

  // One coach with nothing synced must not stop every other badge refreshing.
  it("keeps going past a badge it cannot refresh", async () => {
    mockPrisma.coachRankProof.findMany.mockResolvedValue([
      { riotAccountId: "riot-1", coachProfile: { userId: "user-1" } },
      { riotAccountId: "riot-2", coachProfile: { userId: "user-2" } },
    ] as never);
    mockPrisma.rankedHistory.findFirst
      .mockResolvedValueOnce(null as never)
      .mockResolvedValueOnce({ tier: "GOLD", division: "II", lp: 71 } as never);

    expect(await refreshStaleBadges()).toEqual({ checked: 1, failed: 1 });
    expect(mockPrisma.coachRankProof.upsert).toHaveBeenCalledTimes(1);
  });
});
