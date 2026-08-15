import type { DraftGameState, DraftSeriesState, TeamNumber } from "./draft.types";

export function findGame(series: DraftSeriesState, gameNumber: number): DraftGameState | null {
  return series.games.find((g) => g.gameNumber === gameNumber) ?? null;
}

/** Returns a new series with `next` swapped in for the game of the same number. */
export function replaceGame(series: DraftSeriesState, next: DraftGameState): DraftSeriesState {
  return {
    ...series,
    games: series.games.map((g) => (g.gameNumber === next.gameNumber ? next : g)),
  };
}

export function otherTeam(team: TeamNumber): TeamNumber {
  return team === 1 ? 2 : 1;
}

/**
 * A fresh game. Sides alternate down the series — game 1 puts team 1 on blue,
 * game 2 puts team 2 on blue, and so on. Either drafter can override this from
 * the game tab before the ready check.
 */
export function createGame(gameNumber: number): DraftGameState {
  return {
    gameNumber,
    blueTeam: gameNumber % 2 === 1 ? 1 : 2,
    phase: "LOBBY",
    step: 0,
    blueReady: false,
    redReady: false,
    turnStartedAt: null,
    winnerSide: null,
    version: 0,
    actions: [],
  };
}

export function createGames(gameCount: number): DraftGameState[] {
  return Array.from({ length: gameCount }, (_, i) => createGame(i + 1));
}
