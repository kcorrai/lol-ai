import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => undefined),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getUpcoming, getCompleted, getLiveEvents } from "./scheduleService";

interface EventOverrides {
  state?: string;
  type?: string;
  startTime?: string;
  match?: unknown;
}

// The lean shape `getSchedule` actually returns: no event id, no league id, and
// teams carrying neither id nor slug.
function leanEvent(id: string, overrides: EventOverrides = {}): unknown {
  const { state = "unstarted", type = "match", startTime = "2026-08-18T19:00:00Z" } = overrides;
  return {
    startTime,
    state,
    type,
    blockName: "Week 4",
    league: { name: "LEC", slug: "lec" },
    match:
      "match" in overrides
        ? overrides.match
        : {
            id,
            flags: ["hasVod"],
            strategy: { type: "bestOf", count: 3 },
            teams: [
              {
                name: "G2 Esports",
                code: "G2",
                image: "http://static.lolesports.com/teams/g2.png",
                result: { outcome: "win", gameWins: 2 },
                record: { wins: 5, losses: 1 },
              },
              {
                name: "Fnatic",
                code: "FNC",
                image: null,
                result: { outcome: "loss", gameWins: 0 },
              },
            ],
          },
  };
}

function page(events: unknown[], pages: { older?: string; newer?: string } = {}): unknown {
  return {
    data: {
      schedule: {
        pages: { older: pages.older ?? null, newer: pages.newer ?? null },
        events,
      },
    },
  };
}

/** Serves a different body per pageToken, and records the tokens requested. */
function mockPages(bodies: Record<string, unknown>): { tokens: (string | null)[] } {
  const tokens: (string | null)[] = [];
  global.fetch = vi.fn(async (url: string) => {
    const token = new URL(url).searchParams.get("pageToken");
    tokens.push(token);
    return { ok: true, status: 200, json: async () => bodies[token ?? "current"] };
  }) as unknown as typeof fetch;
  return { tokens };
}

describe("event mapping", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps the lean schedule payload, leaving team ids absent rather than invented", async () => {
    mockPages({ current: page([leanEvent("m1")]) });

    const [event] = await getUpcoming();
    expect(event).toMatchObject({
      matchId: "m1",
      state: "unstarted",
      bestOf: 3,
      blockName: "Week 4",
      hasVod: true,
      league: { id: null, slug: "lec", name: "LEC" },
    });
    expect(event.teams[0]).toMatchObject({
      id: null,
      slug: null,
      code: "G2",
      gameWins: 2,
      outcome: "win",
      image: "https://static.lolesports.com/teams/g2.png",
      record: { wins: 5, losses: 1 },
    });
    expect(event.teams[1].record).toBeNull();
  });

  it("keeps the ids and slugs the live payload carries", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () =>
        page([
          {
            id: "e1",
            startTime: "2026-08-15T19:00:00Z",
            state: "inProgress",
            type: "match",
            blockName: "Week 4",
            league: { id: "l1", slug: "cblol-brazil", name: "CBLOL", image: null },
            tournament: { id: "t1" },
            match: {
              id: "m9",
              teams: [
                { id: "team-a", slug: "los", name: "LOS", code: "LOS", result: { gameWins: 2 } },
                {
                  id: "team-b",
                  slug: "vivo-keyd",
                  name: "VKS",
                  code: "VKS",
                  result: { gameWins: 0 },
                },
              ],
              strategy: { count: 3 },
            },
          },
        ]),
    }) as unknown as typeof fetch;

    const [event] = await getLiveEvents();
    expect(event).toMatchObject({ matchId: "m9", tournamentId: "t1", state: "inProgress" });
    expect(event.league.id).toBe("l1");
    expect(event.teams.map((t) => t.slug)).toEqual(["los", "vivo-keyd"]);
  });

  it("skips entries it cannot render honestly", async () => {
    mockPages({
      current: page([
        leanEvent("keep"),
        leanEvent("show", { type: "show" }),
        leanEvent("nomatch", { match: null }),
        // An unrecognised state must not be guessed at — printing "final" over a
        // game still being played is worse than omitting the row.
        leanEvent("weird", { state: "rescheduled" }),
      ]),
    });

    expect((await getUpcoming()).map((e) => e.matchId)).toEqual(["keep"]);
  });
});

describe("getUpcoming / getCompleted", () => {
  beforeEach(() => vi.clearAllMocks());

  it("splits the window by state and orders each direction from now outwards", async () => {
    mockPages({
      current: page([
        leanEvent("past-1", { state: "completed", startTime: "2026-08-10T12:00:00Z" }),
        leanEvent("past-2", { state: "completed", startTime: "2026-08-12T12:00:00Z" }),
        leanEvent("live", { state: "inProgress", startTime: "2026-08-15T19:00:00Z" }),
        leanEvent("next", { state: "unstarted", startTime: "2026-08-18T19:00:00Z" }),
      ]),
    });

    expect((await getUpcoming()).map((e) => e.matchId)).toEqual(["live", "next"]);
    expect((await getCompleted()).map((e) => e.matchId)).toEqual(["past-2", "past-1"]);
  });

  it("respects the limit", async () => {
    mockPages({
      current: page([
        leanEvent("a", { startTime: "2026-08-18T10:00:00Z" }),
        leanEvent("b", { startTime: "2026-08-18T12:00:00Z" }),
        leanEvent("c", { startTime: "2026-08-18T14:00:00Z" }),
      ]),
    });

    expect((await getUpcoming({ limit: 2 })).map((e) => e.matchId)).toEqual(["a", "b"]);
  });

  it("stays on one request when the limit fits inside one window", async () => {
    const { tokens } = mockPages({ current: page([leanEvent("a")], { newer: "next-token" }) });

    await getUpcoming({ limit: 20 });
    expect(tokens).toEqual([null]);
  });

  it("follows the feed's paging token when the limit needs more, and de-duplicates", async () => {
    const { tokens } = mockPages({
      current: page([leanEvent("a"), leanEvent("overlap")], { newer: "p2" }),
      p2: page([leanEvent("overlap"), leanEvent("b", { startTime: "2026-08-19T19:00:00Z" })]),
    });

    const events = await getUpcoming({ limit: 100 });
    expect(tokens).toEqual([null, "p2"]);
    expect(events.map((e) => e.matchId)).toEqual(["a", "overlap", "b"]);
  });

  it("stops paging at the cap even when the feed keeps offering more", async () => {
    const { tokens } = mockPages({
      current: page([leanEvent("a")], { newer: "p2" }),
      p2: page([leanEvent("b")], { newer: "p3" }),
      p3: page([leanEvent("c")], { newer: "p4" }),
      p4: page([leanEvent("d")], { newer: "p5" }),
    });

    await getUpcoming({ limit: 10_000 });
    // One window plus the two-page cap — never an unbounded walk of the feed.
    expect(tokens).toEqual([null, "p2", "p3"]);
  });

  it("returns an empty list when the feed is down and nothing was cached", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;

    expect(await getUpcoming()).toEqual([]);
    expect(await getCompleted()).toEqual([]);
    expect(await getLiveEvents()).toEqual([]);
  });
});
