import { aggregateKDA, kdaRatio } from "@/lib/kda";
import { perMinute } from "@/domains/esports/duration";
import type { PlayerGame } from "@/domains/esports/types";

/**
 * A pro's recent games read as form: a record, three averages, and one KDA
 * figure per game in the order they were played.
 */

export interface PlayerFormSummary {
  games: number;
  wins: number;
  /** Games whose result the final frame could not tell; left out of the record. */
  unknown: number;
  /** Ratio of the sums, the way every LoL site means an aggregate KDA. */
  kda: number;
  /** Null when no game had a length to divide by. */
  csPerMin: number | null;
  /** Fraction 0–1; null when the feed published no kill participation. */
  killParticipation: number | null;
}

export interface FormPoint {
  gameId: string;
  matchId: string;
  gameNumber: number;
  championId: string;
  kda: number;
  won: boolean | null;
}

/** Oldest first: by the series' kickoff, then by game number inside a series. */
export function chronological(games: PlayerGame[]): PlayerGame[] {
  return [...games].sort(
    (a, b) => a.startTime.localeCompare(b.startTime) || a.gameNumber - b.gameNumber
  );
}

function mean(values: number[]): number | null {
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function playerFormSummary(games: PlayerGame[]): PlayerFormSummary {
  const total = (pick: (game: PlayerGame) => number): number =>
    games.reduce((sum, game) => sum + pick(game), 0);

  const rates = games.flatMap((game) => {
    const rate = perMinute(game.creepScore, game.durationSeconds);
    return rate === null ? [] : [rate];
  });
  const participation = games.flatMap((game) =>
    game.killParticipation === null ? [] : [game.killParticipation]
  );

  return {
    games: games.length,
    wins: games.filter((game) => game.won === true).length,
    unknown: games.filter((game) => game.won === null).length,
    kda: aggregateKDA(
      total((game) => game.kills),
      total((game) => game.deaths),
      total((game) => game.assists)
    ),
    csPerMin: mean(rates),
    killParticipation: mean(participation),
  };
}

/** One point per game, oldest first, for the KDA strip. */
export function formPoints(games: PlayerGame[]): FormPoint[] {
  return chronological(games).map((game) => ({
    gameId: game.gameId,
    matchId: game.matchId,
    gameNumber: game.gameNumber,
    championId: game.championId,
    kda: kdaRatio(game.kills, game.deaths, game.assists),
    won: game.won,
  }));
}
