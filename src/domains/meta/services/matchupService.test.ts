import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/domains/meta/services/metaStatsService", () => ({
  getMetaSnapshot: vi.fn(),
  findChampionStats: vi.fn(),
}));
vi.mock("@/domains/meta/services/championDetailService", () => ({
  getChampionCounters: vi.fn(),
}));
vi.mock("@/lib/ddragon/championsData", () => ({
  fetchAllChampions: vi.fn(),
}));

import { getMatchupData } from "./matchupService";
import { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionCounters } from "@/domains/meta/services/championDetailService";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import type { ChampionMetaStats, MatchupEntry, MetaSnapshot } from "@/domains/meta/types";

const mockSnapshot = getMetaSnapshot as unknown as ReturnType<typeof vi.fn>;
const mockFind = findChampionStats as unknown as ReturnType<typeof vi.fn>;
const mockChampions = fetchAllChampions as unknown as ReturnType<typeof vi.fn>;
const mockCounters = getChampionCounters as unknown as ReturnType<typeof vi.fn>;

const AHRI: ChampionMetaStats = {
  championId: 103,
  championKey: "Ahri",
  name: "Ahri",
  overallWinRate: 51,
  overallPickRate: 8,
  overallBanRate: 6,
  overallGames: 120000,
  overallTier: 1,
  overallRank: 5,
  prevPatchRank: 7,
  positions: [
    { position: "MIDDLE", games: 300000, winRate: 51, pickRate: 8, banRate: 6, tier: 1, rank: 2, counters: [] },
  ],
};

// Ahri's rich MID counters (now sourced from getChampionCounters) — includes Zed.
const AHRI_MID_COUNTERS: MatchupEntry[] = [
  { opponentId: 238, games: 8000, subjectWins: 3400, subjectWinRate: 42.5 },
];

const ZED: ChampionMetaStats = {
  championId: 238,
  championKey: "Zed",
  name: "Zed",
  overallWinRate: 50,
  overallPickRate: 9,
  overallBanRate: 20,
  overallGames: 90000,
  overallTier: 2,
  overallRank: 12,
  prevPatchRank: 9,
  positions: [
    { position: "MIDDLE", games: 250000, winRate: 50, pickRate: 9, banRate: 20, tier: 2, rank: 8, counters: [] },
  ],
};

// getChampionCounters keyed by championId+position; only Ahri lists Zed.
function countersFor(id: number): MatchupEntry[] {
  return id === 103 ? AHRI_MID_COUNTERS : [];
}

const SNAPSHOT: MetaSnapshot = { patch: "16.13", fetchedAt: "x", champions: [AHRI, ZED] };

function summary(id: string, name: string, range: number, tags: string[], difficulty = 5) {
  return {
    id,
    key: "0",
    name,
    title: "",
    tags,
    info: { attack: 3, defense: 4, magic: 8, difficulty },
    stats: {
      hp: 500,
      hpperlevel: 90,
      armor: 20,
      armorperlevel: 4,
      spellblock: 30,
      spellblockperlevel: 1,
      attackdamage: 53,
      attackdamageperlevel: 3,
      attackrange: range,
      movespeed: 330,
    },
    blurb: "",
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mockSnapshot.mockResolvedValue(SNAPSHOT);
  mockChampions.mockResolvedValue([
    summary("Ahri", "Ahri", 550, ["Mage", "Assassin"]),
    summary("Zed", "Zed", 125, ["Assassin"]),
  ]);
  mockFind.mockImplementation((_snap: MetaSnapshot, key: string | number) => {
    if (key === "Ahri" || key === 103) return AHRI;
    if (key === "Zed" || key === 238) return ZED;
    return null;
  });
  mockCounters.mockImplementation(async (id: number) => countersFor(id));
});

describe("getMatchupData", () => {
  it("reports the head-to-head win rate and verdict from A's perspective", async () => {
    const report = await getMatchupData("Ahri", "Zed", "MIDDLE");

    expect(report).not.toBeNull();
    expect(report!.position).toBe("MIDDLE");
    expect(report!.patch).toBe("16.13");
    expect(report!.aWinRateVsB).toBe(42.5);
    expect(report!.games).toBe(8000);
    expect(report!.verdict).toBe("unfavored");
    expect(report!.championA.name).toBe("Ahri");
    expect(report!.championB.name).toBe("Zed");
  });

  it("derives the inverse win rate when only B has the matchup recorded", async () => {
    // Swap perspective: Zed vs Ahri — Ahri has the entry (Zed wins 57.5%)
    const report = await getMatchupData("Zed", "Ahri", "MIDDLE");
    expect(report!.aWinRateVsB).toBe(57.5); // 100 - 42.5
    expect(report!.games).toBe(8000);
    expect(report!.verdict).toBe("favored");
  });

  it("builds lane hints from Data Dragon stats (range + assassin tags)", async () => {
    const report = await getMatchupData("Ahri", "Zed", "MIDDLE");
    expect(report!.hints.length).toBeGreaterThan(0);
    expect(report!.hints.join(" ")).toMatch(/out-ranges/i);
  });

  it("returns even with zero games when neither side has the matchup", async () => {
    mockCounters.mockResolvedValue([]); // neither champion lists the other
    const report = await getMatchupData("Ahri", "Zed", "MIDDLE");
    expect(report!.games).toBe(0);
    expect(report!.verdict).toBe("even");
  });

  it("returns null when the snapshot is unavailable", async () => {
    mockSnapshot.mockResolvedValue(null);
    expect(await getMatchupData("Ahri", "Zed")).toBeNull();
  });
});
