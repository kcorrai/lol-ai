import { describe, it, expect, vi, beforeEach } from "vitest";

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

import { getMetaSnapshot, findChampionStats, __clearSnapshotMemo } from "./metaStatsService";
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
      average_stats: { play: 3_500_000, win_rate: 0.517, pick_rate: 0.087, ban_rate: 0.069, tier: 1 },
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
  // become meaningless.
  __clearSnapshotMemo();
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
