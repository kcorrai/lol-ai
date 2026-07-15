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

import { evaluateDraft } from "./draftEvalService";
import { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionCounters } from "@/domains/meta/services/championDetailService";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import type { CanonicalPosition, ChampionMetaStats, MetaSnapshot } from "@/domains/meta/types";

const mockSnapshot = getMetaSnapshot as unknown as ReturnType<typeof vi.fn>;
const mockFind = findChampionStats as unknown as ReturnType<typeof vi.fn>;
const mockCounters = getChampionCounters as unknown as ReturnType<typeof vi.fn>;
const mockChampions = fetchAllChampions as unknown as ReturnType<typeof vi.fn>;

function summary(id: string, tags: string[], attack: number, magic: number, defense: number) {
  return {
    id,
    key: "0",
    name: id,
    title: "",
    tags,
    info: { attack, defense, magic, difficulty: 5 },
    stats: {
      hp: 500, hpperlevel: 90, armor: 20, armorperlevel: 4, spellblock: 30,
      spellblockperlevel: 1, attackdamage: 55, attackdamageperlevel: 3,
      attackrange: 150, movespeed: 335,
    },
    blurb: "",
  };
}

function stats(id: number, key: string, position: CanonicalPosition, winRate: number, tier: number): ChampionMetaStats {
  return {
    championId: id,
    championKey: key,
    name: key,
    overallWinRate: winRate,
    overallPickRate: 5,
    overallBanRate: 2,
    overallGames: 70000,
    overallTier: tier,
    overallRank: 20,
    prevPatchRank: 20,
    positions: [
      { position, games: 10000, winRate, pickRate: 5, banRate: 2, tier, rank: 5, counters: [] },
    ],
  };
}

// Blue: strong meta, physical, tanky frontline. Red: weaker meta, AP-heavy.
const SUMMARIES = [
  summary("Garen", ["Fighter", "Tank"], 7, 1, 7),
  summary("Vi", ["Fighter"], 8, 3, 5),
  summary("Yasuo", ["Fighter", "Assassin"], 8, 4, 4),
  summary("Jinx", ["Marksman"], 9, 1, 2),
  summary("Leona", ["Tank", "Support"], 4, 3, 8),
  summary("Teemo", ["Marksman", "Assassin"], 5, 6, 3),
  summary("Amumu", ["Tank", "Mage"], 2, 6, 6),
  summary("Veigar", ["Mage"], 2, 9, 2),
  summary("Ziggs", ["Mage"], 2, 8, 2),
  summary("Sona", ["Support", "Mage"], 2, 7, 2),
];

const STATS: Record<string, ChampionMetaStats> = {
  Garen: stats(86, "Garen", "TOP", 53, 1),
  Vi: stats(254, "Vi", "JUNGLE", 52, 2),
  Yasuo: stats(157, "Yasuo", "MIDDLE", 51, 2),
  Jinx: stats(222, "Jinx", "BOTTOM", 52, 1),
  Leona: stats(89, "Leona", "UTILITY", 52, 1),
  Teemo: stats(17, "Teemo", "TOP", 49, 4),
  Amumu: stats(32, "Amumu", "JUNGLE", 50, 3),
  Veigar: stats(45, "Veigar", "MIDDLE", 49, 3),
  Ziggs: stats(115, "Ziggs", "BOTTOM", 48, 4),
  Sona: stats(37, "Sona", "UTILITY", 50, 3),
};

const BLUE = { TOP: "Garen", JUNGLE: "Vi", MIDDLE: "Yasuo", BOTTOM: "Jinx", UTILITY: "Leona" };
const RED = { TOP: "Teemo", JUNGLE: "Amumu", MIDDLE: "Veigar", BOTTOM: "Ziggs", UTILITY: "Sona" };

beforeEach(() => {
  vi.clearAllMocks();
  mockSnapshot.mockResolvedValue({ patch: "16.13", fetchedAt: "x", champions: Object.values(STATS) } as MetaSnapshot);
  mockChampions.mockResolvedValue(SUMMARIES);
  mockFind.mockImplementation((_s: MetaSnapshot, key: string) => STATS[key] ?? null);
  mockCounters.mockResolvedValue([]);
});

describe("evaluateDraft", () => {
  it("evaluates both teams with meta win rates and damage profiles", async () => {
    const result = await evaluateDraft(BLUE, RED);

    expect(result).not.toBeNull();
    expect(result!.patch).toBe("16.13");
    expect(result!.blue.champions).toHaveLength(5);
    expect(result!.red.champions).toHaveLength(5);

    // Blue is physical-leaning, Red is AP-leaning
    expect(result!.blue.adShare).toBeGreaterThan(result!.red.adShare);
    expect(result!.red.apShare).toBeGreaterThan(result!.blue.apShare);

    // Blue has the higher average win rate
    expect(result!.blue.avgWinRate).toBeGreaterThan(result!.red.avgWinRate);

    // Blue has more frontline (Garen+Leona tanks)
    expect(result!.blue.frontlineScore).toBeGreaterThan(result!.red.frontlineScore);
  });

  it("produces a verdict mentioning the stronger meta side", async () => {
    const result = await evaluateDraft(BLUE, RED);
    expect(result!.verdict).toMatch(/Blue has the stronger meta picks/i);
    expect(result!.verdict).toMatch(/magic|AP/i); // Red's AP skew flagged
  });

  it("computes lane edges from matchup win rates", async () => {
    mockCounters.mockImplementation(async (id: number, pos: CanonicalPosition) =>
      id === 86 && pos === "TOP"
        ? [{ opponentId: 17, games: 3000, subjectWins: 1800, subjectWinRate: 60 }]
        : []
    );
    const result = await evaluateDraft(BLUE, RED);
    const top = result!.laneEdges.find((e) => e.position === "TOP");
    expect(top!.favored).toBe("blue");
    expect(top!.blueWinRate).toBe(60);
  });

  it("returns null when the snapshot is unavailable", async () => {
    mockSnapshot.mockResolvedValue(null);
    expect(await evaluateDraft(BLUE, RED)).toBeNull();
  });
});
