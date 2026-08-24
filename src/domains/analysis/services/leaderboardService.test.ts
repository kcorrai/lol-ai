import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/prismaReadonly", () => ({
  prismaReadonly: { $queryRaw: vi.fn() },
}));

vi.mock("@/lib/cache/redisCache", () => ({
  redisCacheGet: vi.fn(),
  redisCacheSet: vi.fn(),
}));

import { getLeaderboard } from "./leaderboardService";
import { prismaReadonly } from "@/lib/db/prismaReadonly";
import { redisCacheGet, redisCacheSet } from "@/lib/cache/redisCache";

const queryRaw = vi.mocked(prismaReadonly.$queryRaw);
const cacheGet = vi.mocked(redisCacheGet);
const cacheSet = vi.mocked(redisCacheSet);

/**
 * One row per account — where it started the window and where it ended it. This is the shape the
 * database now returns; the service no longer sees the snapshots in between, because they never
 * leave Postgres.
 */
function bounds(overrides: {
  first: [tier: string, division: string, lp: number, wins: number, losses: number];
  last: [tier: string, division: string, lp: number, wins: number, losses: number];
  gameName?: string;
  profileSlug?: string;
  profileIconId?: number | null;
}) {
  const [firstTier, firstDivision, firstLp, firstWins, firstLosses] = overrides.first;
  const [lastTier, lastDivision, lastLp, lastWins, lastLosses] = overrides.last;
  return {
    gameName: overrides.gameName ?? "KaaN",
    tagLine: "TR1",
    profileIconId: overrides.profileIconId ?? 1234,
    profileSlug: overrides.profileSlug ?? "KaaN-TR1",
    firstTier,
    firstDivision,
    firstLp,
    firstWins,
    firstLosses,
    lastTier,
    lastDivision,
    lastLp,
    lastWins,
    lastLosses,
  };
}

describe("getLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cacheGet.mockResolvedValue(null);
    cacheSet.mockResolvedValue(true);
  });

  it("returns an empty list when nothing qualified", async () => {
    queryRaw.mockResolvedValue([] as never);

    expect(await getLeaderboard("week")).toEqual([]);
  });

  it("computes lpGained across divisions", async () => {
    // GOLD II 50LP = 3*400 + 2*100 + 50 = 1450; GOLD I 75LP = 3*400 + 3*100 + 75 = 1575.
    queryRaw.mockResolvedValue([
      bounds({ first: ["GOLD", "II", 50, 10, 5], last: ["GOLD", "I", 75, 14, 7] }),
    ] as never);

    const [entry] = await getLeaderboard("week");

    expect(entry.lpGained).toBe(125);
    expect(entry.wins).toBe(4);
    expect(entry.losses).toBe(2);
    expect(entry.displayName).toBe("KaaN#TR1");
    expect(entry.currentTier).toBe("GOLD");
    expect(entry.currentDivision).toBe("I");
    expect(entry.currentLp).toBe(75);
  });

  it("computes winRate from the games played inside the window", async () => {
    // 10/10 → 16/14 is six wins and four losses, not a 53% lifetime rate.
    queryRaw.mockResolvedValue([
      bounds({ first: ["GOLD", "II", 0, 10, 10], last: ["GOLD", "II", 50, 16, 14] }),
    ] as never);

    const [entry] = await getLeaderboard("week");

    expect(entry.winRate).toBe(60);
  });

  it("sorts by lpGained and numbers the ranks from one", async () => {
    queryRaw.mockResolvedValue([
      bounds({
        first: ["GOLD", "II", 0, 5, 2],
        last: ["GOLD", "II", 100, 10, 5],
        profileSlug: "small",
      }),
      bounds({
        first: ["SILVER", "I", 0, 5, 2],
        last: ["GOLD", "II", 0, 10, 5],
        gameName: "Faker",
        profileSlug: "big",
      }),
    ] as never);

    const result = await getLeaderboard("week");

    expect(result.map((r) => r.profileSlug)).toEqual(["big", "small"]);
    expect(result.map((r) => r.rank)).toEqual([1, 2]);
  });

  it("caps the board at 50 entries", async () => {
    queryRaw.mockResolvedValue(
      Array.from({ length: 60 }, (_, i) =>
        bounds({
          first: ["GOLD", "II", 0, 5, 2],
          last: ["GOLD", "II", i, 15, 5],
          profileSlug: `slug-${i}`,
        })
      ) as never
    );

    expect(await getLeaderboard("week")).toHaveLength(50);
  });

  // The thresholds moved into SQL precisely so a non-qualifying account is never transferred.
  // Asserting them in TypeScript would assert the opposite of what the change is for, so what is
  // pinned here is that the query carries them and the window it names.
  it("asks the database for the window and both thresholds", async () => {
    queryRaw.mockResolvedValue([] as never);

    await getLeaderboard("month");

    const values = queryRaw.mock.calls[0]!.slice(1) as unknown[];
    const since = values.find((v): v is Date => v instanceof Date)!;
    const diffDays = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThanOrEqual(29);
    expect(diffDays).toBeLessThanOrEqual(31);
    expect(values).toContain(2); // minimum snapshots
    expect(values).toContain(3); // minimum games played
  });

  it("uses a 7-day window for the weekly period", async () => {
    queryRaw.mockResolvedValue([] as never);

    await getLeaderboard("week");

    const since = (queryRaw.mock.calls[0]!.slice(1) as unknown[]).find(
      (v): v is Date => v instanceof Date
    )!;
    const diffDays = (Date.now() - since.getTime()) / (1000 * 60 * 60 * 24);

    expect(diffDays).toBeGreaterThanOrEqual(6);
    expect(diffDays).toBeLessThanOrEqual(8);
  });

  // The route reads searchParams, so `revalidate` does nothing and every request would otherwise
  // reach Postgres. This cache is the only layer that can stop it.
  it("serves a cached board without touching the database", async () => {
    cacheGet.mockResolvedValue([{ rank: 1, profileSlug: "cached" }]);

    const result = await getLeaderboard("week");

    expect(result).toEqual([{ rank: 1, profileSlug: "cached" }]);
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("caches per period, so the weekly board cannot be served for the monthly one", async () => {
    queryRaw.mockResolvedValue([] as never);

    await getLeaderboard("week");
    await getLeaderboard("month");

    expect(cacheGet.mock.calls.map((c) => c[0])).toEqual([
      "leaderboard:v1:week",
      "leaderboard:v1:month",
    ]);
    expect(cacheSet.mock.calls.map((c) => c[0])).toEqual([
      "leaderboard:v1:week",
      "leaderboard:v1:month",
    ]);
  });
});
