import { describe, expect, it } from "vitest";
import { chronological, formPoints, playerFormSummary } from "@/domains/esports/playerForm";
import type { PlayerGame } from "@/domains/esports/types";

function game(over: Partial<PlayerGame>): PlayerGame {
  return {
    matchId: "m1",
    gameId: "g1",
    gameNumber: 1,
    playerId: "p1",
    handle: "Caps",
    championId: "Azir",
    kills: 2,
    deaths: 1,
    assists: 4,
    creepScore: 300,
    startTime: "2026-09-01T16:00:00Z",
    won: true,
    killParticipation: 0.6,
    durationSeconds: 1800,
    ...over,
  };
}

describe("chronological", () => {
  it("orders by kickoff, then by game inside a series", () => {
    const ordered = chronological([
      game({ gameId: "late-1", startTime: "2026-09-08T16:00:00Z", gameNumber: 1 }),
      game({ gameId: "early-2", startTime: "2026-09-01T16:00:00Z", gameNumber: 2 }),
      game({ gameId: "early-1", startTime: "2026-09-01T16:00:00Z", gameNumber: 1 }),
    ]);
    expect(ordered.map((g) => g.gameId)).toEqual(["early-1", "early-2", "late-1"]);
  });
});

describe("playerFormSummary", () => {
  it("records wins, keeps unknown results apart, and averages the rates", () => {
    const summary = playerFormSummary([
      game({ kills: 4, deaths: 2, assists: 6, won: true, creepScore: 300, durationSeconds: 1800 }),
      game({ kills: 0, deaths: 2, assists: 2, won: false, creepScore: 240, durationSeconds: 1200 }),
      game({ won: null, killParticipation: null, durationSeconds: null }),
    ]);

    expect(summary).toMatchObject({ games: 3, wins: 1, unknown: 1 });
    // (4+0+2 kills + 6+2+4 assists) / (2+2+1 deaths) = 18 / 5.
    expect(summary.kda).toBe(3.6);
    expect(summary.csPerMin).toBe(11); // mean of 10 and 12; the untimed game drops out
    expect(summary.killParticipation).toBeCloseTo(0.6);
  });

  it("has no rates to state for games without lengths or participation", () => {
    const summary = playerFormSummary([game({ durationSeconds: null, killParticipation: null })]);
    expect(summary.csPerMin).toBeNull();
    expect(summary.killParticipation).toBeNull();
  });
});

describe("formPoints", () => {
  it("gives one KDA per game, oldest first, with deaths floored at one", () => {
    const points = formPoints([
      game({ gameId: "b", startTime: "2026-09-02T00:00:00Z", kills: 3, deaths: 0, assists: 2 }),
      game({ gameId: "a", startTime: "2026-09-01T00:00:00Z", kills: 1, deaths: 2, assists: 3 }),
    ]);
    expect(points.map((p) => [p.gameId, p.kda])).toEqual([
      ["a", 2],
      ["b", 5],
    ]);
  });
});
