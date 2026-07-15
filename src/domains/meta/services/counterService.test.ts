import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/domains/meta/services/metaStatsService", () => ({
  getMetaSnapshot: vi.fn(),
  findChampionStats: vi.fn(),
}));
vi.mock("@/domains/meta/services/championDetailService", () => ({
  getChampionCounters: vi.fn(),
}));

import { getCounterData } from "./counterService";
import { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionCounters } from "@/domains/meta/services/championDetailService";
import type { ChampionMetaStats, MatchupEntry, MetaSnapshot } from "@/domains/meta/types";

const mockGetSnapshot = getMetaSnapshot as unknown as ReturnType<typeof vi.fn>;
const mockFind = findChampionStats as unknown as ReturnType<typeof vi.fn>;
const mockCounters = getChampionCounters as unknown as ReturnType<typeof vi.fn>;

function champ(
  championId: number,
  championKey: string,
  name: string,
  positions: ChampionMetaStats["positions"] = []
): ChampionMetaStats {
  return {
    championId,
    championKey,
    name,
    overallWinRate: 50,
    overallPickRate: 5,
    overallBanRate: 1,
    overallGames: 80000,
    overallTier: 3,
    overallRank: 10,
    prevPatchRank: 10,
    positions,
  };
}

const AHRI = champ(103, "Ahri", "Ahri", [
  { position: "MIDDLE", games: 300000, winRate: 51, pickRate: 8, banRate: 6, tier: 1, rank: 2, prevPatchRank: 4, counters: [] },
  { position: "BOTTOM", games: 5000, winRate: 49, pickRate: 1, banRate: 6, tier: 4, rank: 30, prevPatchRank: 28, counters: [] },
]);

// Rich per-lane counters now come from getChampionCounters, not the snapshot.
const AHRI_MID_COUNTERS: MatchupEntry[] = [
  { opponentId: 10, games: 5000, subjectWins: 2100, subjectWinRate: 42 }, // hard
  { opponentId: 7, games: 4000, subjectWins: 1800, subjectWinRate: 45 }, // hard
  { opponentId: 99, games: 3000, subjectWins: 1800, subjectWinRate: 60 }, // easy
  { opponentId: 55, games: 2000, subjectWins: 1160, subjectWinRate: 58 }, // easy
];

const SNAPSHOT: MetaSnapshot = {
  patch: "16.13",
  fetchedAt: "x",
  champions: [
    AHRI,
    champ(10, "Kayle", "Kayle"),
    champ(7, "Leblanc", "LeBlanc"),
    champ(99, "Lux", "Lux"),
    champ(55, "Katarina", "Katarina"),
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetSnapshot.mockResolvedValue(SNAPSHOT);
  mockFind.mockReturnValue(AHRI);
  mockCounters.mockResolvedValue(AHRI_MID_COUNTERS);
});

describe("getCounterData", () => {
  it("returns enriched strong/weak matchups for the requested position", async () => {
    const result = await getCounterData("Ahri", "MIDDLE");

    expect(result).not.toBeNull();
    expect(result!.position).toBe("MIDDLE");
    expect(result!.patch).toBe("16.13");
    expect(result!.availablePositions.sort()).toEqual(["BOTTOM", "MIDDLE"]);

    // opponents that beat Ahri (subject win rate < 50), hardest first
    expect(result!.strongAgainstSubject.map((m) => m.name)).toEqual(["Kayle", "LeBlanc"]);
    expect(result!.strongAgainstSubject[0].opponentWinRate).toBe(58); // 100 - 42

    // opponents Ahri beats (subject win rate > 50), easiest first
    expect(result!.weakAgainstSubject.map((m) => m.name)).toEqual(["Lux", "Katarina"]);
    expect(result!.weakAgainstSubject[0].subjectWinRate).toBe(60);
  });

  it("defaults to the most-played position when none is given", async () => {
    const result = await getCounterData("Ahri");
    expect(result!.position).toBe("MIDDLE"); // 300k games vs 5k
  });

  it("falls back to a valid position when the requested one is not played", async () => {
    const result = await getCounterData("Ahri", "TOP");
    expect(result!.position).toBe("MIDDLE");
  });

  it("returns null when the snapshot is unavailable", async () => {
    mockGetSnapshot.mockResolvedValue(null);
    expect(await getCounterData("Ahri", "MIDDLE")).toBeNull();
  });

  it("returns null when the champion is not found", async () => {
    mockFind.mockReturnValue(null);
    expect(await getCounterData("Unknown", "MIDDLE")).toBeNull();
  });

  it("returns null when the counters feed is unavailable", async () => {
    mockCounters.mockResolvedValue(null);
    expect(await getCounterData("Ahri", "MIDDLE")).toBeNull();
  });
});
