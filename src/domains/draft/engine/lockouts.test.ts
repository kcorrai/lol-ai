import { describe, expect, it } from "vitest";
import { makeSeries } from "@/test/draftFixtures";
import { computeSeriesLockouts, teamOnSide } from "./lockouts";
import type { DraftActionState, DraftSeriesState, SeriesMode, TeamNumber } from "./draft.types";

function action(
  step: number,
  side: DraftActionState["side"],
  kind: DraftActionState["kind"],
  championKey: string
): DraftActionState {
  return { step, side, kind, championKey, timedOut: false };
}

/** Finishes game 1 with two picks and one ban per side. */
function playedGameOne(mode: SeriesMode, blueTeam: TeamNumber = 1): DraftSeriesState {
  const series = makeSeries({ mode, gameCount: 3 });
  return {
    ...series,
    games: series.games.map((g) =>
      g.gameNumber === 1
        ? {
            ...g,
            blueTeam,
            phase: "COMPLETE" as const,
            step: 20,
            actions: [
              action(0, "BLUE", "BAN", "Ashe"),
              action(1, "RED", "BAN", "Bard"),
              action(6, "BLUE", "PICK", "Ahri"),
              action(7, "RED", "PICK", "Akali"),
              action(9, "BLUE", "PICK", "Alistar"),
              action(8, "RED", "PICK", "Amumu"),
            ],
          }
        : g
    ),
  };
}

describe("series lockouts", () => {
  it("locks nothing across games in NORMAL", () => {
    const locks = computeSeriesLockouts(playedGameOne("NORMAL"), 2);
    expect(locks.blue.size).toBe(0);
    expect(locks.red.size).toBe(0);
  });

  it("locks every earlier pick for both sides in FEARLESS", () => {
    const locks = computeSeriesLockouts(playedGameOne("FEARLESS"), 2);
    const all = ["ahri", "akali", "alistar", "amumu"];
    for (const key of all) {
      expect(locks.blue.has(key)).toBe(true);
      expect(locks.red.has(key)).toBe(true);
    }
  });

  it("locks only a team's own earlier picks in TEAM_FEARLESS", () => {
    // Game 1 had team 1 on blue; game 2 seats team 2 on blue, so team 1's picks
    // must follow it across to the red side.
    const locks = computeSeriesLockouts(playedGameOne("TEAM_FEARLESS"), 2);
    expect([...locks.red].sort()).toEqual(["ahri", "alistar"]);
    expect([...locks.blue].sort()).toEqual(["akali", "amumu"]);
  });

  it("never carries bans, in any mode", () => {
    for (const mode of ["NORMAL", "FEARLESS", "TEAM_FEARLESS"] as const) {
      const locks = computeSeriesLockouts(playedGameOne(mode), 2);
      expect(locks.blue.has("ashe")).toBe(false);
      expect(locks.red.has("bard")).toBe(false);
    }
  });

  it("ignores games at or after the one being drafted", () => {
    const series = playedGameOne("FEARLESS");
    expect(computeSeriesLockouts(series, 1).blue.size).toBe(0);
    expect(computeSeriesLockouts(series, 3).blue.size).toBe(4);
  });

  it("returns nothing for an unknown game", () => {
    expect(computeSeriesLockouts(playedGameOne("FEARLESS"), 9).blue.size).toBe(0);
  });

  it("maps sides back to teams", () => {
    const game = playedGameOne("NORMAL", 2).games[0];
    expect(teamOnSide(game, "BLUE")).toBe(2);
    expect(teamOnSide(game, "RED")).toBe(1);
  });
});
