import { describe, it, expect, vi, beforeEach } from "vitest";
import { getLeaderboard } from "./leaderboardService";

vi.mock("@/lib/db/prismaReadonly", () => ({
  prismaReadonly: {
    rankedHistory: { findMany: vi.fn() },
  },
}));

import { prismaReadonly as prisma } from "@/lib/db/prismaReadonly";

function makeEntry(overrides: {
  riotAccountId: string;
  tier: string;
  division: string;
  lp: number;
  wins: number;
  losses: number;
  recordedAt: Date;
  gameName?: string;
  tagLine?: string;
  profileIconId?: number;
  profileSlug?: string;
}) {
  return {
    riotAccountId: overrides.riotAccountId,
    tier: overrides.tier,
    division: overrides.division,
    lp: overrides.lp,
    wins: overrides.wins,
    losses: overrides.losses,
    recordedAt: overrides.recordedAt,
    riotAccount: {
      gameName: overrides.gameName ?? "KaaN",
      tagLine: overrides.tagLine ?? "TR1",
      profileIconId: overrides.profileIconId ?? 1234,
      user: { profileSlug: overrides.profileSlug ?? "KaaN-TR1" },
    },
  };
}

describe("getLeaderboard", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns empty array when no history entries", async () => {
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    const result = await getLeaderboard("week");

    expect(result).toEqual([]);
  });

  it("excludes accounts with fewer than 2 history entries", async () => {
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 50,
        wins: 10,
        losses: 5,
        recordedAt: new Date(),
      }),
    ] as never);

    const result = await getLeaderboard("week");

    expect(result).toHaveLength(0);
  });

  it("excludes accounts with fewer than 3 games played in the period", async () => {
    const t0 = new Date("2024-01-01");
    const t1 = new Date("2024-01-07");
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 50,
        wins: 10,
        losses: 5,
        recordedAt: t0,
      }),
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 75,
        wins: 11,
        losses: 6,
        recordedAt: t1,
      }),
      // wins diff = 1, losses diff = 1 → 2 games → excluded
    ] as never);

    const result = await getLeaderboard("week");

    expect(result).toHaveLength(0);
  });

  it("correctly computes lpGained across tiers", async () => {
    const t0 = new Date("2024-01-01");
    const t1 = new Date("2024-01-07");
    // GOLD II 50LP → GOLD I 75LP
    // DIVISION_ORDER: IV=0, III=1, II=2, I=3
    // Gold II 50LP = 3*400 + 2*100 + 50 = 1450
    // Gold I  75LP = 3*400 + 3*100 + 75 = 1575
    // lpGained = 125
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 50,
        wins: 10,
        losses: 5,
        recordedAt: t0,
      }),
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "I",
        lp: 75,
        wins: 14,
        losses: 7,
        recordedAt: t1,
      }),
    ] as never);

    const result = await getLeaderboard("week");

    expect(result).toHaveLength(1);
    expect(result[0].lpGained).toBe(125);
    expect(result[0].wins).toBe(4);
    expect(result[0].losses).toBe(2);
  });

  it("sorts entries by lpGained descending", async () => {
    const t0 = new Date("2024-01-01");
    const t1 = new Date("2024-01-07");
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      // acc-1: small gain (100 LP)
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 0,
        wins: 5,
        losses: 2,
        recordedAt: t0,
        profileSlug: "p1",
      }),
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 100,
        wins: 10,
        losses: 5,
        recordedAt: t1,
        profileSlug: "p1",
      }),
      // acc-2: larger gain (500 LP)
      makeEntry({
        riotAccountId: "acc-2",
        tier: "SILVER",
        division: "I",
        lp: 0,
        wins: 5,
        losses: 2,
        recordedAt: t0,
        gameName: "Faker",
        profileSlug: "p2",
      }),
      makeEntry({
        riotAccountId: "acc-2",
        tier: "GOLD",
        division: "II",
        lp: 0,
        wins: 10,
        losses: 5,
        recordedAt: t1,
        gameName: "Faker",
        profileSlug: "p2",
      }),
    ] as never);

    const result = await getLeaderboard("week");

    expect(result[0].displayName).toBeTruthy();
    expect(result[0].lpGained).toBeGreaterThan(result[1].lpGained);
  });

  it("assigns sequential rank starting from 1", async () => {
    const t0 = new Date("2024-01-01");
    const t1 = new Date("2024-01-07");
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 0,
        wins: 5,
        losses: 2,
        recordedAt: t0,
        profileSlug: "p1",
      }),
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 100,
        wins: 10,
        losses: 5,
        recordedAt: t1,
        profileSlug: "p1",
      }),
      makeEntry({
        riotAccountId: "acc-2",
        tier: "SILVER",
        division: "I",
        lp: 50,
        wins: 5,
        losses: 2,
        recordedAt: t0,
        gameName: "Faker",
        profileSlug: "p2",
      }),
      makeEntry({
        riotAccountId: "acc-2",
        tier: "GOLD",
        division: "I",
        lp: 0,
        wins: 10,
        losses: 5,
        recordedAt: t1,
        gameName: "Faker",
        profileSlug: "p2",
      }),
    ] as never);

    const result = await getLeaderboard("week");

    expect(result.length).toBeGreaterThan(0);
    result.forEach((entry, i) => {
      expect(entry.rank).toBe(i + 1);
    });
  });

  it("caps leaderboard at 50 entries", async () => {
    const t0 = new Date("2024-01-01");
    const t1 = new Date("2024-01-07");
    // Create 60 accounts each with 10 games played
    const entries = Array.from({ length: 60 }, (_, i) => [
      makeEntry({
        riotAccountId: `acc-${i}`,
        tier: "GOLD",
        division: "II",
        lp: 0,
        wins: 5,
        losses: 2,
        recordedAt: t0,
        profileSlug: `slug-${i}`,
      }),
      makeEntry({
        riotAccountId: `acc-${i}`,
        tier: "GOLD",
        division: "II",
        lp: 50,
        wins: 15,
        losses: 5,
        recordedAt: t1,
        profileSlug: `slug-${i}`,
      }),
    ]).flat();

    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue(entries as never);

    const result = await getLeaderboard("week");

    expect(result.length).toBeLessThanOrEqual(50);
  });

  it("computes winRate correctly", async () => {
    const t0 = new Date("2024-01-01");
    const t1 = new Date("2024-01-07");
    // 6 wins, 4 losses → 60% WR
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 0,
        wins: 10,
        losses: 10,
        recordedAt: t0,
      }),
      makeEntry({
        riotAccountId: "acc-1",
        tier: "GOLD",
        division: "II",
        lp: 50,
        wins: 16,
        losses: 14,
        recordedAt: t1,
      }),
    ] as never);

    const result = await getLeaderboard("week");

    expect(result[0].winRate).toBe(60);
    expect(result[0].wins).toBe(6);
    expect(result[0].losses).toBe(4);
  });

  it("uses 30-day window for monthly period", async () => {
    vi.mocked(prisma.rankedHistory.findMany).mockResolvedValue([]);

    await getLeaderboard("month");

    const callArg = vi.mocked(prisma.rankedHistory.findMany).mock.calls[0][0] as {
      where: { recordedAt: { gte: Date } };
    };
    const since = callArg.where.recordedAt.gte;
    const diffDays = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24);
    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(31);
  });
});
