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

import { getMetaSnapshot, findChampionStats, getChampionCounters } from "./metaStatsService";
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
      average_stats: { win_rate: 0.517, pick_rate: 0.087, ban_rate: 0.069, tier: 1 },
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
      key === "meta:snapshot:last-good" ? lastGood : null
    );
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 }) as unknown as typeof fetch;

    const snapshot = await getMetaSnapshot();

    expect(snapshot).toBe(lastGood);
    expect(mockSetCached).not.toHaveBeenCalled();
  });

  it("falls back to the last-good snapshot on malformed data", async () => {
    const lastGood: MetaSnapshot = { patch: "16.12", fetchedAt: "old", champions: [] };
    mockGetCached.mockImplementation(async (key: string) =>
      key === "meta:snapshot:last-good" ? lastGood : null
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

describe("getChampionCounters", () => {
  const DETAIL = {
    data: {
      counters: [
        { champion_id: 238, play: 9882, win: 4926 }, // 49.8
        { champion_id: 517, play: 16741, win: 8253 }, // 49.3
        { champion_id: 99, play: 100, win: 60 }, // filtered: sample < 200
      ],
    },
  };

  it("fetches, filters, maps and sorts the detailed counters", async () => {
    mockGetCached.mockResolvedValue(null);
    mockFetchOk(DETAIL);

    const counters = await getChampionCounters(103, "MIDDLE");

    expect(counters).not.toBeNull();
    expect(counters).toHaveLength(2); // tiny sample dropped
    // sorted ascending by subject win rate
    expect(counters![0].opponentId).toBe(517); // 49.3
    expect(counters![1].opponentId).toBe(238); // 49.8
    expect(counters![0].subjectWinRate).toBe(49.3);
    expect(mockSetCached).toHaveBeenCalledTimes(2); // fresh + last-good
  });

  it("hits the correct per-position endpoint", async () => {
    mockGetCached.mockResolvedValue(null);
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => DETAIL });
    global.fetch = fetchSpy as unknown as typeof fetch;

    await getChampionCounters(103, "BOTTOM");

    expect(fetchSpy.mock.calls[0][0]).toContain("/champions/ranked/103/ADC");
  });

  it("falls back to the last-good counters on an API error", async () => {
    const lastGood = [{ opponentId: 1, games: 500, subjectWins: 260, subjectWinRate: 52 }];
    mockGetCached.mockImplementation(async (key: string) =>
      key.endsWith(":last-good") ? lastGood : null
    );
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    const counters = await getChampionCounters(103, "MIDDLE");
    expect(counters).toBe(lastGood);
  });

  it("returns null when the feed is down and nothing was cached", async () => {
    mockGetCached.mockResolvedValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    expect(await getChampionCounters(103, "MIDDLE")).toBeNull();
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
        overallTier: 1,
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
