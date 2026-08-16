import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => undefined),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { archiveLeagues, getVodArchive } from "./vodArchiveService";

function event(over: Record<string, unknown> = {}) {
  return {
    startTime: "2026-08-13T18:00:00Z",
    state: "completed",
    blockName: "Week 2",
    league: { name: "LEC" },
    match: {
      id: "m-1",
      strategy: { count: 3 },
      teams: [
        {
          name: "G2 Esports",
          code: "G2",
          image: "http://static.lolesports.com/teams/g2.png",
          result: { gameWins: 2 },
        },
        { name: "Fnatic", code: "FNC", image: null, result: { gameWins: 1 } },
      ],
    },
    games: [
      {
        id: "g-1",
        state: "completed",
        vods: [
          { parameter: "adBJ3Auz7VQ", startMillis: 0, endMillis: 2640000 },
          // The same recording under a second locale — one game, one video.
          { parameter: "adBJ3Auz7VQ", startMillis: 0, endMillis: 2640000 },
        ],
      },
      {
        id: "g-2",
        state: "completed",
        vods: [{ parameter: "bQ2c75kKpHU", startMillis: 9240000, endMillis: 11220000 }],
      },
    ],
    ...over,
  };
}

function mockFeed(events: unknown[]): void {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ data: { schedule: { events } } }),
  })) as unknown as typeof fetch;
}

describe("getVodArchive", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps a recorded series with a chip per game", async () => {
    mockFeed([event()]);

    const [series] = await getVodArchive();
    expect(series).toMatchObject({
      matchId: "m-1",
      leagueName: "LEC",
      blockName: "Week 2",
      bestOf: 3,
    });
    expect(series.teams[0]).toEqual({
      name: "G2 Esports",
      code: "G2",
      // The feed hands out plain http and the CSP blocks mixed content.
      image: "https://static.lolesports.com/teams/g2.png",
      gameWins: 2,
    });
    expect(series.games.map((game) => game.number)).toEqual([1, 2]);
  });

  it("counts one video per game however many locales carry it", async () => {
    mockFeed([event()]);

    const [series] = await getVodArchive();
    expect(series.games[0].videoIds).toEqual(["adBJ3Auz7VQ"]);
  });

  it("numbers games by position, which is the only source this endpoint gives", async () => {
    mockFeed([event()]);

    const [series] = await getVodArchive();
    expect(series.games[1]).toMatchObject({ id: "g-2", number: 2, startMillis: 9240000 });
  });

  it("reads the broadcast segment length from the offsets", async () => {
    mockFeed([event()]);

    const [series] = await getVodArchive();
    // 11220000 - 9240000 ms. Draft and post-game included, so longer than the
    // game itself — which is why it is not called a duration.
    expect(series.games[1].segmentSeconds).toBe(1980);
  });

  it("has no segment length when the feed publishes no offsets", async () => {
    mockFeed([
      event({
        games: [{ id: "g-1", state: "completed", vods: [{ parameter: "adBJ3Auz7VQ" }] }],
      }),
    ]);

    const [series] = await getVodArchive();
    expect(series.games[0]).toMatchObject({ startMillis: null, segmentSeconds: null });
  });

  it("leaves out a series with nothing recorded", async () => {
    mockFeed([
      event(),
      event({ match: { id: "m-2", strategy: null, teams: [] }, games: [{ id: "g-9", vods: [] }] }),
    ]);

    const archive = await getVodArchive();
    expect(archive.map((series) => series.matchId)).toEqual(["m-1"]);
  });

  it("puts the most recent series first", async () => {
    mockFeed([
      event({ startTime: "2026-08-10T18:00:00Z", match: { ...event().match, id: "old" } }),
      event({ startTime: "2026-08-15T18:00:00Z", match: { ...event().match, id: "new" } }),
    ]);

    expect((await getVodArchive()).map((series) => series.matchId)).toEqual(["new", "old"]);
  });

  it("returns an empty archive rather than throwing when the feed is down", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;

    expect(await getVodArchive()).toEqual([]);
  });
});

describe("archiveLeagues", () => {
  it("ranks leagues by how much of the archive they are", async () => {
    mockFeed([
      event(),
      event({ match: { ...event().match, id: "m-2" } }),
      event({ league: { name: "LCK" }, match: { ...event().match, id: "m-3" } }),
    ]);

    expect(archiveLeagues(await getVodArchive())).toEqual([
      { name: "LEC", series: 2 },
      { name: "LCK", series: 1 },
    ]);
  });

  it("breaks a tie by name so the filter bar does not reshuffle itself", async () => {
    mockFeed([
      event({ league: { name: "LPL" }, match: { ...event().match, id: "m-2" } }),
      event({ league: { name: "LCK" }, match: { ...event().match, id: "m-3" } }),
    ]);

    expect(archiveLeagues(await getVodArchive()).map((league) => league.name)).toEqual([
      "LCK",
      "LPL",
    ]);
  });
});
