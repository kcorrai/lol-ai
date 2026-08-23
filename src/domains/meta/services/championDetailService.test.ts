import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getChampionDetail, getChampionCounters, getChampionBuild } from "./championDetailService";
import { getCached, setCached } from "@/lib/ai/aiCache";

const mockGetCached = getCached as unknown as ReturnType<typeof vi.fn>;
const mockSetCached = setCached as unknown as ReturnType<typeof vi.fn>;

const DETAIL_BODY = {
  data: {
    counters: [
      { champion_id: 238, play: 9882, win: 4926 }, // 49.8
      { champion_id: 517, play: 16741, win: 8253 }, // 49.3
      { champion_id: 99, play: 100, win: 60 }, // filtered: sample < 200
    ],
    runes: [
      {
        primary_page_id: 8100,
        primary_rune_ids: [8112, 8139, 8140, 8106],
        secondary_page_id: 8200,
        secondary_rune_ids: [8210, 8226],
        stat_mod_ids: [5008, 5008, 5001],
        play: 1000,
        win: 540,
      },
    ],
    summoner_spells: [{ ids: [4, 14], play: 900, win: 480 }],
    core_items: [{ ids: [3118, 4645, 3157], play: 800, win: 440 }],
    boots: [{ ids: [3020], play: 700, win: 370 }],
    starter_items: [{ ids: [1056, 2003], play: 950, win: 500 }],
    last_items: [
      { ids: [3089], play: 400, win: 220 },
      { ids: [3135], play: 300, win: 150 },
    ],
    // op.gg returns exactly 15 levels; the service completes the rest (see skillOrder.ts).
    skills: [
      {
        order: ["W", "Q", "E", "Q", "Q", "R", "Q", "W", "Q", "W", "R", "W", "W", "E", "E"],
        play: 600,
        win: 330,
      },
    ],
    skill_masteries: [{ ids: ["Q", "W", "E"], play: 700, win: 400 }],
    game_lengths: [
      { game_length: 0, rate: 0.49 },
      { game_length: 30, rate: 0.53 },
    ],
    trends: {
      win: [
        { version: "16.13", rate: 0.51, rank: 12 },
        { version: "16.12", rate: 0.5, rank: 18 },
      ],
    },
  },
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
  mockSetCached.mockResolvedValue(undefined);
});

describe("getChampionDetail", () => {
  it("parses counters and the full build, and caches both keys", async () => {
    mockGetCached.mockResolvedValue(null);
    mockFetchOk(DETAIL_BODY);

    const detail = await getChampionDetail(103, "MIDDLE");

    expect(detail).not.toBeNull();
    // counters: tiny sample dropped, sorted ascending
    expect(detail!.counters).toHaveLength(2);
    expect(detail!.counters[0].opponentId).toBe(517);

    const b = detail!.build;
    expect(b.runes?.primaryRuneIds).toEqual([8112, 8139, 8140, 8106]);
    expect(b.runes?.statShardIds).toEqual([5008, 5008, 5001]);
    expect(b.summonerSpellIds).toEqual([4, 14]);
    expect(b.coreItems?.ids).toEqual([3118, 4645, 3157]);
    expect(b.boots?.ids).toEqual([3020]);
    expect(b.lateItemOptions).toHaveLength(2);
    // 15 levels in, 18 out — the last R at 16, then the two E points still owed.
    expect(b.skillOrder).toEqual([
      "W",
      "Q",
      "E",
      "Q",
      "Q",
      "R",
      "Q",
      "W",
      "Q",
      "W",
      "R",
      "W",
      "W",
      "E",
      "E",
      "R",
      "E",
      "E",
    ]);
    expect(b.skillMaxOrder).toEqual(["Q", "W", "E"]);
    expect(b.gameLengths).toEqual([
      { minutes: 0, winRate: 49 },
      { minutes: 30, winRate: 53 },
    ]);
    expect(b.trend[0]).toEqual({ version: "16.13", winRate: 51, rank: 12 });

    expect(mockSetCached).toHaveBeenCalledTimes(2);
  });

  it("hits the ranked per-position endpoint", async () => {
    mockGetCached.mockResolvedValue(null);
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => DETAIL_BODY });
    global.fetch = spy as unknown as typeof fetch;

    await getChampionDetail(103, "BOTTOM");
    expect(spy.mock.calls[0][0]).toContain("/champions/ranked/103/ADC");
  });

  it("hits the ARAM endpoint with position NONE", async () => {
    mockGetCached.mockResolvedValue(null);
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => DETAIL_BODY });
    global.fetch = spy as unknown as typeof fetch;

    await getChampionDetail(103, "MIDDLE", { mode: "aram" });
    expect(spy.mock.calls[0][0]).toContain("/champions/aram/103/NONE");
  });

  it("passes the rank tier param for ranked", async () => {
    mockGetCached.mockResolvedValue(null);
    const spy = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => DETAIL_BODY });
    global.fetch = spy as unknown as typeof fetch;

    await getChampionDetail(103, "MIDDLE", { tier: "master_plus" });
    expect(spy.mock.calls[0][0]).toContain("?tier=master_plus");
  });

  it("falls back to last-good on an API error", async () => {
    const lastGood = { counters: [], build: { championId: 103 } };
    mockGetCached.mockImplementation(async (key: string) =>
      key.endsWith(":last-good") ? lastGood : null
    );
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 }) as unknown as typeof fetch;

    expect(await getChampionDetail(103, "MIDDLE")).toBe(lastGood);
  });
});

describe("getChampionCounters / getChampionBuild", () => {
  it("derive from the shared detail", async () => {
    mockGetCached.mockResolvedValue(null);
    mockFetchOk(DETAIL_BODY);
    const counters = await getChampionCounters(103, "MIDDLE");
    expect(counters).toHaveLength(2);

    mockGetCached.mockResolvedValue(null);
    mockFetchOk(DETAIL_BODY);
    const build = await getChampionBuild(103, "MIDDLE");
    expect(build?.coreItems?.ids).toEqual([3118, 4645, 3157]);
  });

  it("return null when the feed is down and nothing cached", async () => {
    mockGetCached.mockResolvedValue(null);
    global.fetch = vi.fn().mockRejectedValue(new Error("network")) as unknown as typeof fetch;
    expect(await getChampionCounters(103, "MIDDLE")).toBeNull();
    expect(await getChampionBuild(103, "MIDDLE")).toBeNull();
  });
});
