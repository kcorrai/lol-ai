import { describe, it, expect } from "vitest";
import { teamRecord } from "./teamRecord";
import type { EsportsEvent, EsportsEventTeam, EsportsTeam } from "@/domains/esports/types";

const T1: EsportsTeam = {
  id: "1",
  slug: "t1",
  name: "T1",
  code: "T1",
  image: null,
  backgroundImage: null,
  status: "active",
  league: { name: "LCK", region: "KOREA" },
  players: [],
};

function side(over: Partial<EsportsEventTeam> & { code: string }): EsportsEventTeam {
  return {
    id: null,
    slug: null,
    name: over.code,
    image: null,
    gameWins: 0,
    outcome: null,
    record: null,
    ...over,
  };
}

function series(matchId: string, home: EsportsEventTeam, away: EsportsEventTeam): EsportsEvent {
  return {
    matchId,
    startTime: "2026-08-10T10:00:00Z",
    state: "completed",
    blockName: null,
    bestOf: 3,
    league: { id: null, slug: "lck", name: "LCK", image: null },
    tournamentId: null,
    teams: [home, away],
    hasVod: false,
    streams: [],
  };
}

describe("teamRecord", () => {
  it("counts series and games from both sides of the scoreline", () => {
    const results = [
      series(
        "a",
        side({ code: "T1", gameWins: 2, outcome: "win" }),
        side({ code: "GEN", gameWins: 1, outcome: "loss" })
      ),
      series(
        "b",
        side({ code: "DK", gameWins: 2, outcome: "win" }),
        side({ code: "T1", gameWins: 0, outcome: "loss" })
      ),
    ];

    expect(teamRecord(T1, results)).toEqual({
      series: { wins: 1, losses: 1 },
      games: { wins: 2, losses: 3 },
      seriesWinRate: 50,
    });
  });

  it("skips a series the team was not in", () => {
    const results = [
      series("a", side({ code: "GEN", gameWins: 2, outcome: "win" }), side({ code: "DK" })),
    ];

    expect(teamRecord(T1, results).series).toEqual({ wins: 0, losses: 0 });
  });

  it("counts the games of an undecided series without counting the series", () => {
    const results = [
      series("a", side({ code: "T1", gameWins: 1 }), side({ code: "GEN", gameWins: 1 })),
    ];

    const record = teamRecord(T1, results);
    expect(record.series).toEqual({ wins: 0, losses: 0 });
    expect(record.games).toEqual({ wins: 1, losses: 1 });
    expect(record.seriesWinRate).toBeNull();
  });

  it("reports no win rate rather than a nought when nothing has been decided", () => {
    expect(teamRecord(T1, []).seriesWinRate).toBeNull();
  });
});
