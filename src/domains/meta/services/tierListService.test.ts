import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/domains/meta/services/metaStatsService", () => ({
  getMetaSnapshot: vi.fn(),
}));

import { getTierList, tierLetter } from "./tierListService";
import { getMetaSnapshot } from "@/domains/meta/services/metaStatsService";
import type { ChampionMetaStats, MetaSnapshot } from "@/domains/meta/types";

const mockSnapshot = getMetaSnapshot as unknown as ReturnType<typeof vi.fn>;

function champ(
  key: string,
  mid: { tier: number; rank: number; winRate: number; pickRate: number } | null
): ChampionMetaStats {
  return {
    championId: 1,
    championKey: key,
    name: key,
    overallWinRate: 50,
    overallPickRate: 5,
    overallBanRate: 2,
    overallGames: 100000,
    overallTier: 3,
    overallRank: 15,
    prevPatchRank: 15,
    positions: mid
      ? [
          {
            position: "MIDDLE",
            games: 10000,
            winRate: mid.winRate,
            pickRate: mid.pickRate,
            banRate: 3,
            tier: mid.tier,
            rank: mid.rank,
            prevPatchRank: mid.rank + 3,
            counters: [],
          },
        ]
      : [],
  };
}

const SNAPSHOT: MetaSnapshot = {
  patch: "16.13",
  fetchedAt: "x",
  champions: [
    champ("Ahri", { tier: 2, rank: 5, winRate: 51, pickRate: 8 }),
    champ("Zed", { tier: 1, rank: 3, winRate: 52, pickRate: 9 }),
    champ("Yasuo", { tier: 1, rank: 1, winRate: 50, pickRate: 12 }),
    champ("OffMeta", { tier: 3, rank: 40, winRate: 55, pickRate: 0.1 }), // below pick threshold
    champ("Garen", null), // does not play MID
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSnapshot.mockResolvedValue(SNAPSHOT);
});

describe("tierLetter", () => {
  it("maps op.gg tiers to letters", () => {
    expect(tierLetter(1)).toBe("S");
    expect(tierLetter(3)).toBe("B");
    expect(tierLetter(0)).toBe("?");
  });
});

describe("getTierList", () => {
  it("returns lane champions ordered best-first (tier then rank)", async () => {
    const list = await getTierList("MIDDLE");

    expect(list).not.toBeNull();
    expect(list!.patch).toBe("16.13");
    // Yasuo (tier1 rank1) > Zed (tier1 rank3) > Ahri (tier2)
    expect(list!.entries.map((e) => e.championKey)).toEqual(["Yasuo", "Zed", "Ahri"]);
  });

  it("excludes champions below the pick-rate threshold and those off-lane", async () => {
    const list = await getTierList("MIDDLE");
    const keys = list!.entries.map((e) => e.championKey);
    expect(keys).not.toContain("OffMeta"); // pickRate 0.1
    expect(keys).not.toContain("Garen"); // no MID stats
  });

  it("returns an empty list for a lane nobody plays", async () => {
    const list = await getTierList("JUNGLE");
    expect(list!.entries).toEqual([]);
  });

  it("returns null when the snapshot is unavailable", async () => {
    mockSnapshot.mockResolvedValue(null);
    expect(await getTierList("MIDDLE")).toBeNull();
  });

  it("flags tiny-sample lanes and sinks them below trustworthy rows", async () => {
    // A noisy 28-game 'S-tier' must not outrank a solid 10k-game B-tier champion.
    const noisy = champ("Noisy", { tier: 1, rank: 1, winRate: 58, pickRate: 5 });
    noisy.positions[0].games = 28;
    mockSnapshot.mockResolvedValue({ ...SNAPSHOT, champions: [...SNAPSHOT.champions, noisy] });

    const list = await getTierList("MIDDLE");
    const noisyEntry = list!.entries.find((e) => e.championKey === "Noisy")!;
    expect(noisyEntry.lowConfidence).toBe(true);
    expect(noisyEntry.games).toBe(28);
    // Every confident row ranks above the noisy one.
    expect(list!.entries[list!.entries.length - 1].championKey).toBe("Noisy");
    expect(list!.entries.find((e) => e.championKey === "Yasuo")!.lowConfidence).toBe(false);
  });
});
