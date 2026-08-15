import type { DraftSeriesState, TeamNumber } from "./draft.types";
import { teamOnSide } from "./lockouts";

export interface SeriesStatus {
  completedGames: number;
  team1Wins: number;
  team2Wins: number;
  /** The game a viewer should be looking at: the first unfinished one, else the last. */
  activeGameNumber: number;
  /** Every game of the series has finished drafting. */
  isComplete: boolean;
}

export function seriesStatus(series: DraftSeriesState): SeriesStatus {
  let completedGames = 0;
  const wins: Record<TeamNumber, number> = { 1: 0, 2: 0 };

  for (const game of series.games) {
    if (game.phase !== "COMPLETE") continue;
    completedGames += 1;
    if (game.winnerSide) wins[teamOnSide(game, game.winnerSide)] += 1;
  }

  const pending = series.games.find((g) => g.phase !== "COMPLETE");
  const last = series.games[series.games.length - 1];

  return {
    completedGames,
    team1Wins: wins[1],
    team2Wins: wins[2],
    activeGameNumber: pending?.gameNumber ?? last?.gameNumber ?? 1,
    isComplete: completedGames === series.games.length && series.games.length > 0,
  };
}
