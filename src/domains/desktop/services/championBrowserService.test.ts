import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetTierList = vi.fn();
const mockGetCounterData = vi.fn();
const mockFetchItems = vi.fn();

vi.mock("@/domains/meta", () => ({
  getTierList: (...args: unknown[]) => mockGetTierList(...args),
  getCounterData: (...args: unknown[]) => mockGetCounterData(...args),
}));

vi.mock("@/lib/ddragon/itemsData", () => ({
  fetchItems: () => mockFetchItems(),
}));

import { listChampions, readChampion } from "@/domains/desktop/services/championBrowserService";
import type { ChampionBuild } from "@/domains/meta";
import type { RoleTierList, TierListEntry } from "@/domains/meta/services/tierListService";
import type { CounterMatchup, CounterResult } from "@/domains/meta/services/counterService";
import type { ItemInfo } from "@/lib/ddragon/itemsData";

// The fixtures are typed as what the meta domain really returns, not as loose objects.
// That is the point of this file: it guards a mapping, and a mapping can only be guarded
// against a shape the compiler is holding to.

function tierListEntry(over: Partial<TierListEntry> = {}): TierListEntry {
  return {
    championKey: "Ahri",
    name: "Ahri",
    tier: 1,
    rank: 1,
    prevPatchRank: 2,
    winRate: 52.3,
    pickRate: 8.5,
    banRate: 3.2,
    games: 4250,
    lowConfidence: false,
    ...over,
  };
}

function tierList(over: Partial<RoleTierList> = {}): RoleTierList {
  return {
    position: "MIDDLE",
    patch: "26.16",
    fetchedAt: "2026-08-24T10:00:00Z",
    matchCount: 125_000,
    entries: [tierListEntry()],
    ...over,
  };
}

function counterMatchup(over: Partial<CounterMatchup> = {}): CounterMatchup {
  return {
    championId: 238,
    championKey: "Zed",
    name: "Zed",
    games: 1250,
    subjectWinRate: 45.2,
    opponentWinRate: 54.8,
    ...over,
  };
}

function build(over: Partial<ChampionBuild> = {}): ChampionBuild {
  return {
    championId: 103,
    runes: null,
    summonerSpellIds: [4, 12],
    starterItems: { ids: [1055], games: 100, winRate: 51.0 },
    coreItems: { ids: [3153, 3089], games: 4000, winRate: 52.5 },
    boots: { ids: [2055], games: 3900, winRate: 52.0 },
    lateItemOptions: [],
    skillOrder: ["Q", "W", "E", "Q", "Q", "R"],
    skillMaxOrder: ["Q", "W", "E"],
    gameLengths: [],
    trend: [],
    ...over,
  };
}

function counterResult(over: Partial<CounterResult> = {}): CounterResult {
  return {
    championId: 103,
    championKey: "Ahri",
    name: "Ahri",
    position: "MIDDLE",
    patch: "26.16",
    fetchedAt: "2026-08-24T10:00:00Z",
    matchCount: 125_000,
    overallTier: 1,
    availablePositions: ["MIDDLE", "BOTTOM"],
    stats: {
      position: "MIDDLE",
      games: 4250,
      winRate: 52.3,
      pickRate: 8.5,
      banRate: 3.2,
      tier: 1,
      rank: 1,
      prevPatchRank: 2,
      counters: [],
    },
    build: build(),
    strongAgainstSubject: [
      counterMatchup({ championKey: "Zed", name: "Zed", subjectWinRate: 45.2 }),
    ],
    weakAgainstSubject: [
      counterMatchup({ championKey: "Kassadin", name: "Kassadin", subjectWinRate: 55.8 }),
    ],
    ...over,
  };
}

/** Only the name is read, but the catalogue is a real one, so it is built as one. */
function catalogue(entries: ReadonlyArray<[number, string]>): Map<number, ItemInfo> {
  return new Map(
    entries.map(([id, name]) => [
      id,
      { id, name, iconUrl: "", gold: 0, finished: true, consumable: false },
    ])
  );
}

const FULL_CATALOGUE = catalogue([
  [1055, "Doran's Blade"],
  [3153, "Blade of the Ruined King"],
  [3089, "Rabadon's Deathcap"],
  [2055, "Sorcerer's Shoes"],
]);

beforeEach(() => {
  vi.clearAllMocks();
  mockFetchItems.mockResolvedValue(FULL_CATALOGUE);
});

describe("listChampions", () => {
  it("carries every number the lane list is read on", async () => {
    mockGetTierList.mockResolvedValue(tierList());

    const result = await listChampions("MIDDLE");

    expect(result).toEqual({
      position: "MIDDLE",
      patch: "26.16",
      entries: [
        {
          championKey: "Ahri",
          name: "Ahri",
          tier: 1,
          rank: 1,
          winRate: 52.3,
          pickRate: 8.5,
          banRate: 3.2,
          games: 4250,
          lowConfidence: false,
        },
      ],
    });
  });

  it("answers null when the patch snapshot could not be reached", async () => {
    mockGetTierList.mockResolvedValue(null);

    const result = await listChampions("BOTTOM");

    expect(result).toBeNull();
  });

  it("asks the meta domain for the lane it was given", async () => {
    mockGetTierList.mockResolvedValue(tierList());

    await listChampions("TOP");

    expect(mockGetTierList).toHaveBeenCalledWith("TOP");
  });
});

describe("readChampion", () => {
  it("carries the whole reading for one champion in one lane", async () => {
    mockGetCounterData.mockResolvedValue(counterResult());

    const result = await readChampion("Ahri", "MIDDLE");

    expect(result).toEqual({
      champion: { key: "Ahri", name: "Ahri" },
      position: "MIDDLE",
      patch: "26.16",
      availablePositions: ["MIDDLE", "BOTTOM"],
      stats: {
        games: 4250,
        winRate: 52.3,
        pickRate: 8.5,
        banRate: 3.2,
        tier: 1,
      },
      build: {
        skillOrder: ["Q", "W", "E", "Q", "Q", "R"],
        skillMaxOrder: ["Q", "W", "E"],
        starters: [{ id: 1055, name: "Doran's Blade" }],
        core: [
          { id: 3153, name: "Blade of the Ruined King" },
          { id: 3089, name: "Rabadon's Deathcap" },
        ],
        boots: [{ id: 2055, name: "Sorcerer's Shoes" }],
        games: 4000,
        winRate: 52.5,
      },
      counteredBy: [
        {
          championKey: "Zed",
          name: "Zed",
          games: 1250,
          subjectWinRate: 45.2,
        },
      ],
      goodInto: [
        {
          championKey: "Kassadin",
          name: "Kassadin",
          games: 1250,
          subjectWinRate: 55.8,
        },
      ],
    });
  });

  it("means the subject’s win rate in both matchup lists", async () => {
    mockGetCounterData.mockResolvedValue(
      counterResult({
        strongAgainstSubject: [
          counterMatchup({ championKey: "Zed", subjectWinRate: 45.5 }),
          counterMatchup({ championKey: "Talon", name: "Talon", subjectWinRate: 48.1 }),
        ],
        weakAgainstSubject: [
          counterMatchup({ championKey: "Kassadin", subjectWinRate: 55.8 }),
          counterMatchup({ championKey: "Lux", name: "Lux", subjectWinRate: 58.3 }),
        ],
      })
    );

    const result = await readChampion("Ahri", "MIDDLE");

    // subjectWinRate means the subject's win rate, so the same number in both lists.
    expect(result?.counteredBy[0].subjectWinRate).toBe(45.5);
    expect(result?.counteredBy[1].subjectWinRate).toBe(48.1);
    expect(result?.goodInto[0].subjectWinRate).toBe(55.8);
    expect(result?.goodInto[1].subjectWinRate).toBe(58.3);
  });

  it("keeps an item the catalogue did not carry, unnamed", async () => {
    mockFetchItems.mockResolvedValue(catalogue([[1055, "Doran's Blade"]]));
    mockGetCounterData.mockResolvedValue(counterResult());

    const result = await readChampion("Ahri", "MIDDLE");

    // 3153 and 3089 are not in the catalogue.
    expect(result?.build?.core).toEqual([
      { id: 3153, name: "" },
      { id: 3089, name: "" },
    ]);
  });

  it("answers the rest of the reading when there is no build", async () => {
    mockGetCounterData.mockResolvedValue(counterResult({ build: null }));

    const result = await readChampion("Ahri", "MIDDLE");

    expect(result).not.toBeNull();
    expect(result?.build).toBeNull();
  });

  it("answers null for a champion the patch has no reading for", async () => {
    mockGetCounterData.mockResolvedValue(null);

    const result = await readChampion("UnknownChampion", "MIDDLE");

    expect(result).toBeNull();
  });

  it("still sends the build when the item catalogue will not load", async () => {
    mockFetchItems.mockRejectedValue(new Error("ddragon down"));
    mockGetCounterData.mockResolvedValue(counterResult());

    const result = await readChampion("Ahri", "MIDDLE");

    expect(result).not.toBeNull();
    expect(result?.build).not.toBeNull();
    // Items in the build but with empty names since the catalogue failed to load.
    expect(result?.build?.core[0]).toEqual({ id: 3153, name: "" });
  });

  it("asks the meta domain for the champion and lane it was given", async () => {
    mockGetCounterData.mockResolvedValue(counterResult());

    await readChampion("Zed", "TOP");

    expect(mockGetCounterData).toHaveBeenCalledWith("Zed", "TOP");
  });
});
