import {
  normaliseKey,
  type DraftGameState,
  type DraftSeriesState,
  type DraftSide,
  type TeamNumber,
} from "./draft.types";

export interface SeriesLockouts {
  blue: ReadonlySet<string>;
  red: ReadonlySet<string>;
}

const EMPTY: SeriesLockouts = { blue: new Set(), red: new Set() };

/** Which team sits on a given side in a given game. */
export function teamOnSide(game: DraftGameState, side: DraftSide): TeamNumber {
  if (side === "BLUE") return game.blueTeam;
  return game.blueTeam === 1 ? 2 : 1;
}

/**
 * Champions a side may not take in `gameNumber` because of what earlier games in
 * the series already burned (docs/DRAFT_ROOM.md §3).
 *
 * Only picks carry. A ban is spent on the game it was made in, in every mode —
 * carrying bans would let a single early ban remove a champion from an entire
 * Bo5, which is not how any format actually plays.
 */
export function computeSeriesLockouts(
  series: DraftSeriesState,
  gameNumber: number
): SeriesLockouts {
  if (series.mode === "NORMAL") return EMPTY;

  const current = series.games.find((g) => g.gameNumber === gameNumber);
  if (!current) return EMPTY;

  const byTeam = new Map<TeamNumber, Set<string>>([
    [1, new Set<string>()],
    [2, new Set<string>()],
  ]);

  for (const game of series.games) {
    if (game.gameNumber >= gameNumber) continue;
    for (const action of game.actions) {
      if (action.kind !== "PICK" || !action.championKey) continue;
      byTeam.get(teamOnSide(game, action.side))?.add(normaliseKey(action.championKey));
    }
  }

  const team1 = byTeam.get(1) ?? new Set<string>();
  const team2 = byTeam.get(2) ?? new Set<string>();

  if (series.mode === "FEARLESS") {
    // Locked for everyone, so both sides see the same union.
    const all = new Set<string>([...team1, ...team2]);
    return { blue: all, red: all };
  }

  // TEAM_FEARLESS — a team is locked out of its own history only, and it may be
  // sitting on either side this game.
  return {
    blue: teamOnSide(current, "BLUE") === 1 ? team1 : team2,
    red: teamOnSide(current, "RED") === 1 ? team1 : team2,
  };
}
