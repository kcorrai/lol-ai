import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(async () => null),
  setCached: vi.fn(async () => undefined),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { getMatch, defaultGame } from "./matchService";
import type { MatchDetail } from "@/domains/esports/types";

function game(number: number, state: string, extra: Record<string, unknown> = {}) {
  return {
    number,
    id: `g${number}`,
    state,
    teams: [
      { id: "team-a", side: "blue" },
      { id: "team-b", side: "red" },
    ],
    vods: [],
    ...extra,
  };
}

function mockFeed(games: unknown[]): void {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      data: {
        event: {
          id: "m1",
          league: { id: "l1", slug: "worlds", name: "Worlds", image: "http://x/logo.png" },
          tournament: { id: "t1" },
          match: {
            strategy: { count: 5 },
            teams: [
              {
                id: "team-a",
                name: "T1",
                code: "T1",
                image: "http://static.lolesports.com/teams/t1.png",
                result: { gameWins: 3 },
              },
              {
                id: "team-b",
                name: "kt Rolster",
                code: "KT",
                image: null,
                result: { gameWins: 2 },
              },
            ],
            games,
          },
        },
      },
    }),
  }) as unknown as typeof fetch;
}

function detail(games: MatchDetail["games"]): MatchDetail {
  return {
    matchId: "m1",
    bestOf: 5,
    league: { id: "l1", slug: "worlds", name: "Worlds", image: null },
    tournamentId: "t1",
    teams: [],
    games,
  };
}

function gameRef(number: number, state: string): MatchDetail["games"][number] {
  return { number, id: `g${number}`, state, blueTeamId: null, redTeamId: null, hasVod: false, vods: [] };
}

describe("getMatch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("maps teams, format, games and sides, upgrading image URLs", async () => {
    mockFeed([game(1, "completed", { vods: [{ parameter: "abc" }] }), game(2, "unneeded")]);

    const match = await getMatch("m1");
    expect(match).toMatchObject({ matchId: "m1", bestOf: 5, tournamentId: "t1" });
    expect(match?.teams[0]).toMatchObject({
      name: "T1",
      gameWins: 3,
      image: "https://static.lolesports.com/teams/t1.png",
    });
    expect(match?.games[0]).toMatchObject({
      number: 1,
      state: "completed",
      blueTeamId: "team-a",
      redTeamId: "team-b",
      hasVod: true,
    });
  });

  it("tolerates a game with no side assignment yet", async () => {
    mockFeed([{ number: 1, id: "g1", state: "unstarted" }]);

    const match = await getMatch("m1");
    expect(match?.games[0]).toMatchObject({ blueTeamId: null, redTeamId: null, hasVod: false });
  });

  it("returns null when the feed is down and nothing was cached", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("down")) as unknown as typeof fetch;
    expect(await getMatch("m1")).toBeNull();
  });
});

describe("defaultGame", () => {
  it("opens on game 1, which is the canonical URL's content", () => {
    const match = detail([gameRef(1, "completed"), gameRef(2, "completed")]);
    expect(defaultGame(match)?.number).toBe(1);
  });

  it("prefers a game being played right now", () => {
    const match = detail([
      gameRef(1, "completed"),
      gameRef(2, "inProgress"),
      gameRef(3, "unstarted"),
    ]);
    expect(defaultGame(match)?.number).toBe(2);
  });

  it("ignores games the series never needed", () => {
    const match = detail([gameRef(1, "unneeded"), gameRef(2, "completed")]);
    expect(defaultGame(match)?.number).toBe(2);
  });

  it("returns null when no game is playable", () => {
    expect(defaultGame(detail([gameRef(1, "unneeded")]))).toBeNull();
    expect(defaultGame(detail([]))).toBeNull();
  });
});
