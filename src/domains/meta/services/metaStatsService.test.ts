import { describe, it, expect, vi, beforeEach } from "vitest";

// Stands in for the Next.js Data Cache (TASK-292). It models the one property the
// production code depends on: resolved values are stored, rejections are not.
// A pass-through mock would make the shared-cache tests below vacuous — they
// would pass just as well against code that never cached anything.
const { sharedStore } = vi.hoisted(() => ({ sharedStore: new Map<string, unknown>() }));
vi.mock("next/cache", () => ({
  unstable_cache:
    (fn: (...args: unknown[]) => Promise<unknown>) =>
    async (...args: unknown[]) => {
      const key = JSON.stringify(args);
      if (sharedStore.has(key)) return sharedStore.get(key);
      const value = await fn(...args); // a rejection escapes without being stored
      sharedStore.set(key, value);
      return value;
    },
}));

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
}));
vi.mock("@/lib/ddragon/championsData", () => ({
  fetchAllChampions: vi.fn(),
}));
vi.mock("@/lib/ddragon", () => ({
  getLatestDdragonVersion: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  getMetaSnapshot,
  getPopularChampions,
  findChampionStats,
  __clearSnapshotMemo,
  __snapshotMemoSize,
  MEMO_MAX_ENTRIES,
} from "./metaStatsService";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { getLatestDdragonVersion } from "@/lib/ddragon";
import type { MetaSnapshot } from "@/domains/meta/types";

const mockGetCached = getCached as unknown as ReturnType<typeof vi.fn>;
const mockSetCached = setCached as unknown as ReturnType<typeof vi.fn>;
const mockFetchAllChampions = fetchAllChampions as unknown as ReturnType<typeof vi.fn>;
const mockGetVersion = getLatestDdragonVersion as unknown as ReturnType<typeof vi.fn>;

const DDRAGON_CHAMPIONS = [
  { id: "Ahri", key: "103", name: "Ahri" },
  { id: "Zed", key: "238", name: "Zed" },
];

const OPGG_SAMPLE = {
  meta: { version: "16.13", match_count: 38_692_282 },
  data: [
    {
      id: 103,
      average_stats: {
        play: 3_500_000,
        win_rate: 0.517,
        pick_rate: 0.087,
        ban_rate: 0.069,
        tier: 1,
      },
      positions: [
        {
          name: "MID",
          stats: {
            play: 312223,
            win_rate: 0.5176,
            pick_rate: 0.0816,
            ban_rate: 0.069,
            tier_data: { tier: 1, rank: 2 },
          },
          counters: [
            { champion_id: 10, play: 5631, win: 2532 }, // 45.0%
            { champion_id: 99, play: 150, win: 60 }, // filtered: sample < 200
            { champion_id: 7, play: 4000, win: 2200 }, // 55.0%
          ],
        },
        { name: "ADC", stats: { play: 100, win_rate: 0.5, pick_rate: 0.01 }, counters: [] },
      ],
    },
    {
      id: 99999, // not in Data Dragon → skipped
      average_stats: { win_rate: 0.5, pick_rate: 0.01 },
      positions: [],
    },
  ],
};

function mockFetchOk(body: unknown): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => body,
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  vi.clearAllMocks();
  // The snapshot memo added in TASK-282 is process-global, so without this a
  // value cached by one test satisfies the next and the fetch assertions below
  // become meaningless. The shared cache added in TASK-292 outlives tests for
  // the same reason and has to be cleared alongside it.
  __clearSnapshotMemo();
  sharedStore.clear();
  mockFetchAllChampions.mockResolvedValue(DDRAGON_CHAMPIONS);
  mockGetVersion.mockResolvedValue("16.13.1");
  mockSetCached.mockResolvedValue(undefined);
});

describe("getMetaSnapshot — happy path", () => {
  it("fetches, maps and caches a snapshot when no fresh cache exists", async () => {
    mockGetCached.mockResolvedValue(null);
    mockFetchOk(OPGG_SAMPLE);

    const snapshot = await getMetaSnapshot();

    expect(snapshot).not.toBeNull();
    expect(snapshot!.patch).toBe("16.13");
    expect(snapshot!.matchCount).toBe(38_692_282);
    // champion 99999 is skipped (absent from Data Dragon)
    expect(snapshot!.champions).toHaveLength(1);

    const ahri = snapshot!.champions[0];
    expect(ahri.championKey).toBe("Ahri");
    expect(ahri.overallWinRate).toBe(51.7);
    expect(ahri.overallGames).toBe(3_500_000);
    expect(ahri.overallTier).toBe(1);

    const mid = ahri.positions.find((p) => p.position === "MIDDLE");
    expect(mid).toBeDefined();
    expect(mid!.winRate).toBe(51.8);
    // tiny sample dropped; remaining sorted ascending by subject win rate
    expect(mid!.counters).toHaveLength(2);
    expect(mid!.counters[0].opponentId).toBe(10);
    expect(mid!.counters[0].subjectWinRate).toBe(45);
    expect(mid!.counters[1].subjectWinRate).toBe(55);

    // MID→MIDDLE and ADC→BOTTOM both mapped
    expect(ahri.positions.map((p) => p.position).sort()).toEqual(["BOTTOM", "MIDDLE"]);

    // caches both the fresh copy and the last-good snapshot
    expect(mockSetCached).toHaveBeenCalledTimes(2);
  });

  it("returns the fresh cache without hitting the network", async () => {
    const cached: MetaSnapshot = { patch: "16.13", fetchedAt: "x", champions: [] };
    mockGetCached.mockResolvedValue(cached);
    global.fetch = vi.fn() as unknown as typeof fetch;

    const snapshot = await getMetaSnapshot();

    expect(snapshot).toBe(cached);
    expect(global.fetch).not.toHaveBeenCalled();
    expect(mockSetCached).not.toHaveBeenCalled();
  });

  // The point of TASK-282. A single page render calls getMetaSnapshot more than
  // once (getPopularChampions calls it again for the related-links row), and
  // ~739 ISR pages revalidate on a 12h cycle — so an unmemoized read sent the
  // same ~200KB blob across the network tens of thousands of times a month.
  it("reads the cache row once across repeated calls", async () => {
    mockGetCached.mockResolvedValue({ patch: "16.13", fetchedAt: "x", champions: [] });

    await getMetaSnapshot();
    await getMetaSnapshot();
    await getMetaSnapshot();

    expect(mockGetCached).toHaveBeenCalledTimes(1);
  });

  it("keeps separate memo entries per mode and tier", async () => {
    mockGetCached.mockResolvedValue({ patch: "16.13", fetchedAt: "x", champions: [] });

    await getMetaSnapshot({ mode: "ranked" });
    await getMetaSnapshot({ mode: "aram" });
    await getMetaSnapshot({ mode: "ranked" });

    // One read per distinct variant, not one per call.
    expect(mockGetCached).toHaveBeenCalledTimes(2);
  });

  // A null means the feed was down AND no last-good row existed. Holding that
  // for the full window would keep serving empty pages after the feed recovered,
  // so failures get a much shorter memo than successes.
  it("does not memoize a failed snapshot for the full window", async () => {
    mockGetCached.mockResolvedValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error("feed down")) as unknown as typeof fetch;

    const first = await getMetaSnapshot();
    expect(first).toBeNull();

    const realNow = Date.now();
    vi.spyOn(Date, "now").mockReturnValue(realNow + 60_000);

    mockGetCached.mockResolvedValue({ patch: "16.14", fetchedAt: "y", champions: [] });
    const second = await getMetaSnapshot();

    expect(second).not.toBeNull();
    vi.mocked(Date.now).mockRestore();
  });
});

// The process memo only helps an instance that is already warm. These cover the
// shared level underneath it (TASK-292), which is what a cold instance hits.
// Clearing only the memo is how a cold instance is simulated: same shared cache,
// no local state.
describe("getMetaSnapshot — shared cache", () => {
  it("serves a cold instance without reading the row again", async () => {
    mockGetCached.mockResolvedValue({ patch: "16.13", fetchedAt: "x", champions: [] });

    const first = await getMetaSnapshot();
    __clearSnapshotMemo();
    const second = await getMetaSnapshot();

    expect(second).toEqual(first);
    expect(mockGetCached).toHaveBeenCalledTimes(1);
  });

  it("still separates variants in the shared layer", async () => {
    mockGetCached.mockResolvedValue({ patch: "16.13", fetchedAt: "x", champions: [] });

    await getMetaSnapshot({ mode: "ranked" });
    await getMetaSnapshot({ mode: "aram" });
    __clearSnapshotMemo();
    await getMetaSnapshot({ mode: "ranked" });
    await getMetaSnapshot({ mode: "aram" });

    expect(mockGetCached).toHaveBeenCalledTimes(2);
  });

  // The guarantee that makes the hour-long shared TTL safe. Without the sentinel
  // throw, a single null would be shared to every instance for an hour and the
  // whole site would serve empty meta pages long after op.gg recovered — a much
  // worse outage than the one it is caching around.
  it("does not share a null result", async () => {
    mockGetCached.mockResolvedValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error("feed down")) as unknown as typeof fetch;

    expect(await getMetaSnapshot()).toBeNull();
    __clearSnapshotMemo();
    expect(await getMetaSnapshot()).toBeNull();

    // Reached the loader both times: the failure was never stored.
    expect(mockGetCached).toHaveBeenCalledTimes(4); // fresh + last-good, per attempt
  });

  it("recovers immediately once the feed returns", async () => {
    mockGetCached.mockResolvedValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error("feed down")) as unknown as typeof fetch;
    expect(await getMetaSnapshot()).toBeNull();

    __clearSnapshotMemo();
    mockGetCached.mockResolvedValue({ patch: "16.14", fetchedAt: "y", champions: [] });

    expect(await getMetaSnapshot()).not.toBeNull();
  });
});

describe("getMetaSnapshot — degradation", () => {
  it("falls back to the last-good snapshot on an API error", async () => {
    const lastGood: MetaSnapshot = {
      patch: "16.12",
      fetchedAt: "old",
      champions: [],
    };
    // null for fresh key, snapshot for last-good key
    mockGetCached.mockImplementation(async (key: string) =>
      key.endsWith(":last-good") ? lastGood : null
    );
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    const snapshot = await getMetaSnapshot();

    expect(snapshot).toBe(lastGood);
    expect(mockSetCached).not.toHaveBeenCalled();
  });

  it("falls back to the last-good snapshot on malformed data", async () => {
    const lastGood: MetaSnapshot = { patch: "16.12", fetchedAt: "old", champions: [] };
    mockGetCached.mockImplementation(async (key: string) =>
      key.endsWith(":last-good") ? lastGood : null
    );
    mockFetchOk({ unexpected: "shape" });

    const snapshot = await getMetaSnapshot();

    expect(snapshot).toBe(lastGood);
  });

  it("returns null when the feed is down and nothing was ever cached", async () => {
    mockGetCached.mockResolvedValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;

    const snapshot = await getMetaSnapshot();

    expect(snapshot).toBeNull();
  });
});

describe("findChampionStats", () => {
  const snapshot: MetaSnapshot = {
    patch: "16.13",
    fetchedAt: "x",
    champions: [
      {
        championId: 103,
        championKey: "Ahri",
        name: "Ahri",
        overallWinRate: 51.7,
        overallPickRate: 8.7,
        overallBanRate: 6.9,
        overallGames: 3_500_000,
        overallTier: 1,
        overallRank: 5,
        prevPatchRank: 7,
        positions: [],
      },
    ],
  };

  it("finds by Data Dragon key case-insensitively", () => {
    expect(findChampionStats(snapshot, "ahri")?.championId).toBe(103);
  });

  it("finds by numeric Riot key", () => {
    expect(findChampionStats(snapshot, 103)?.championKey).toBe("Ahri");
  });

  it("returns null for an unknown champion", () => {
    expect(findChampionStats(snapshot, "unknown")).toBeNull();
  });
});

describe("derived snapshot views", () => {
  beforeEach(() => {
    mockGetCached.mockResolvedValue(null);
    mockFetchOk(OPGG_SAMPLE);
  });

  // getPopularChampions copied the whole ~170-champion array, filtered it, sorted it in full and
  // kept eight — per call, for a result that depends only on the snapshot, across the ~739 static
  // pages that revalidate together.
  it("orders popular champions by pick rate", async () => {
    const popular = await getPopularChampions(5);
    expect(popular.map((c) => c.key)).toEqual(["Ahri"]);
  });

  it("honours the limit", async () => {
    const popular = await getPopularChampions(1);
    expect(popular).toHaveLength(1);
  });

  it("excludes the champion whose page is asking", async () => {
    const popular = await getPopularChampions(5, "Ahri");
    expect(popular.map((c) => c.key)).not.toContain("Ahri");
  });

  it("is case-insensitive about the exclusion", async () => {
    expect((await getPopularChampions(5, "ahri")).map((c) => c.key)).not.toContain("Ahri");
  });

  it("returns nothing when there is no snapshot to read", async () => {
    mockGetCached.mockResolvedValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error("op.gg down")) as unknown as typeof fetch;
    __clearSnapshotMemo();
    sharedStore.clear();

    expect(await getPopularChampions(5)).toEqual([]);
  });

  it("looks a champion up by key, name and id through the index", async () => {
    const snapshot = await getMetaSnapshot();
    expect(findChampionStats(snapshot!, "ahri")?.championId).toBe(103);
    expect(findChampionStats(snapshot!, "Ahri")?.championId).toBe(103);
    expect(findChampionStats(snapshot!, 103)?.championKey).toBe("Ahri");
    expect(findChampionStats(snapshot!, "nobody")).toBeNull();
  });

  // A caller can pass a snapshot from anywhere — a last-good fallback, a fixture — so the scan has
  // to stay as the path for anything the memo does not hold.
  it("still resolves a snapshot it has never memoised", async () => {
    const snapshot = await getMetaSnapshot();
    const detached: MetaSnapshot = JSON.parse(JSON.stringify(snapshot));
    __clearSnapshotMemo();

    expect(findChampionStats(detached, "ahri")?.championId).toBe(103);
  });
});

describe("snapshot memo bounding", () => {
  // The comment said "at most a handful of variants", which nothing enforced: mode × tier × region
  // is a product and each entry is a ~200KB snapshot. Asserted against the constant rather than a
  // literal — the property is that the memo is bounded, not that the bound is any one number.
  it("never grows past the cap however many variants are asked for", async () => {
    mockGetCached.mockResolvedValue(null);
    mockFetchOk(OPGG_SAMPLE);

    for (let i = 0; i < MEMO_MAX_ENTRIES * 3; i++) {
      await getMetaSnapshot({ tier: `tier-${i}` as never });
    }

    expect(__snapshotMemoSize()).toBeLessThanOrEqual(MEMO_MAX_ENTRIES);
  });

  /** Region is part of the variant: without it every platform would share one entry. */
  it("holds a separate entry per region", async () => {
    mockGetCached.mockResolvedValue(null);
    mockFetchOk(OPGG_SAMPLE);
    __clearSnapshotMemo();

    await getMetaSnapshot();
    await getMetaSnapshot({ region: "euw1" });
    await getMetaSnapshot({ region: "kr" });

    expect(__snapshotMemoSize()).toBe(3);
  });
});
