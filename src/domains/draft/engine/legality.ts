import {
  normaliseKey,
  type DraftGameState,
  type DraftSeriesState,
  type DraftSide,
  type LegalityReason,
  type LegalityResult,
} from "./draft.types";
import { computeSeriesLockouts } from "./lockouts";
import { isComplete, sideToAct, stepAt } from "./sequence";

const OK: LegalityResult = { ok: true };

function deny(reason: LegalityReason): LegalityResult {
  return { ok: false, reason };
}

/** Every champion already banned or picked in this game, by either side. */
export function championsUsedInGame(game: DraftGameState): ReadonlySet<string> {
  const used = new Set<string>();
  for (const action of game.actions) {
    if (action.championKey) used.add(normaliseKey(action.championKey));
  }
  return used;
}

/**
 * Why a champion cannot be selected right now, ignoring whose turn it is.
 * Returns null when the champion is available. The grid uses this to dim a cell
 * and explain itself; unavailable champions stay visible on purpose, because in
 * a fearless series you need to see what the series has already burned.
 */
export function unavailableReason(
  series: DraftSeriesState,
  gameNumber: number,
  side: DraftSide,
  championKey: string,
  knownKeys?: ReadonlySet<string>
): LegalityReason | null {
  const key = normaliseKey(championKey);
  if (!key) return "unknown-champion";
  if (knownKeys && !knownKeys.has(key)) return "unknown-champion";

  const game = series.games.find((g) => g.gameNumber === gameNumber);
  if (!game) return "draft-not-running";

  if (series.disabledChampions.some((c) => normaliseKey(c) === key)) return "disabled";
  if (championsUsedInGame(game).has(key)) return "already-used";

  const lockouts = computeSeriesLockouts(series, gameNumber);
  const locked = side === "BLUE" ? lockouts.blue : lockouts.red;
  if (locked.has(key)) return "series-locked";

  return null;
}

/**
 * Full check for an incoming action: the draft must be live, it must be this
 * side's turn, and the champion must be available. `championKey` may be null
 * only on a ban step — passing a ban is legal, passing a pick is not.
 */
export function canSelect(
  series: DraftSeriesState,
  gameNumber: number,
  side: DraftSide,
  championKey: string | null,
  knownKeys?: ReadonlySet<string>
): LegalityResult {
  const game = series.games.find((g) => g.gameNumber === gameNumber);
  if (!game) return deny("draft-not-running");
  if (game.phase !== "IN_PROGRESS" || isComplete(game.step)) return deny("draft-not-running");
  if (sideToAct(game.step) !== side) return deny("not-your-turn");

  if (championKey === null) {
    return stepAt(game.step)?.kind === "BAN" ? OK : deny("unknown-champion");
  }

  const reason = unavailableReason(series, gameNumber, side, championKey, knownKeys);
  return reason ? deny(reason) : OK;
}
