import type { DraftGameState, DraftSeriesState, DraftSide, TransitionResult } from "./draft.types";
import { canSelect } from "./legality";
import { isComplete, stepAt } from "./sequence";
import { findGame, replaceGame } from "./stateUtils";
import { hasExpired } from "./timing";

function commit(
  game: DraftGameState,
  championKey: string | null,
  nowIso: string,
  timedOut: boolean
): DraftGameState {
  const step = stepAt(game.step);
  if (!step) return game;
  const nextStep = game.step + 1;
  const done = isComplete(nextStep);
  return {
    ...game,
    actions: [
      ...game.actions,
      { step: game.step, side: step.side, kind: step.kind, championKey, timedOut },
    ],
    step: nextStep,
    phase: done ? "COMPLETE" : game.phase,
    turnStartedAt: done ? null : nowIso,
    version: game.version + 1,
  };
}

/** Lock a ban or a pick for `side`. `championKey` may be null only on a ban step. */
export function applyAction(
  series: DraftSeriesState,
  gameNumber: number,
  side: DraftSide,
  championKey: string | null,
  nowIso: string,
  knownKeys?: ReadonlySet<string>
): TransitionResult {
  const game = findGame(series, gameNumber);
  if (!game) return { ok: false, reason: "unknown-game" };

  const legality = canSelect(series, gameNumber, side, championKey, knownKeys);
  if (!legality.ok) return { ok: false, reason: legality.reason };

  return {
    ok: true,
    series: replaceGame(series, commit(game, championKey, nowIso, false)),
    changed: true,
  };
}

/**
 * Step back exactly one action and hand the turn back to whoever made it. The
 * champion returns to the pool because `championsUsedInGame` is derived from the
 * action list — there is no second place to keep it in sync.
 *
 * Only the side that made the last action may undo it. That needs no consent
 * flow and no extra state, and it closes its own window: the moment the opponent
 * locks, the last action is theirs and yours is out of reach. You can take back
 * your own mistake; you can never rewind the enemy's pick.
 */
export function applyUndo(
  series: DraftSeriesState,
  gameNumber: number,
  side: DraftSide,
  nowIso: string
): TransitionResult {
  const game = findGame(series, gameNumber);
  if (!game) return { ok: false, reason: "unknown-game" };
  if (game.actions.length === 0) return { ok: false, reason: "nothing-to-undo" };
  if (game.actions[game.actions.length - 1]!.side !== side) {
    return { ok: false, reason: "not-your-turn" };
  }

  const next: DraftGameState = {
    ...game,
    actions: game.actions.slice(0, -1),
    step: game.step - 1,
    phase: "IN_PROGRESS",
    winnerSide: null,
    turnStartedAt: nowIso,
    version: game.version + 1,
  };
  return { ok: true, series: replaceGame(series, next), changed: true };
}

/**
 * Settle an expired turn. Bans lapse to no ban; picks take the first legal entry
 * of `fallbackPool`, which the caller supplies already ordered by win rate — so
 * the outcome is a pure function of stored state and every observer agrees.
 *
 * Exactly one turn is settled per call, and the next turn's clock restarts from
 * `nowIso`. A drafter who steps away therefore loses one turn, not the draft.
 */
export function resolveTimeout(
  series: DraftSeriesState,
  gameNumber: number,
  nowIso: string,
  fallbackPool: readonly string[]
): TransitionResult {
  const game = findGame(series, gameNumber);
  if (!game) return { ok: false, reason: "unknown-game" };
  if (!hasExpired(series, game, Date.parse(nowIso))) {
    return { ok: true, series, changed: false };
  }

  const step = stepAt(game.step);
  if (!step) return { ok: true, series, changed: false };

  let championKey: string | null = null;
  if (step.kind === "PICK") {
    championKey =
      fallbackPool.find((key) => canSelect(series, gameNumber, step.side, key).ok) ?? null;
  }

  return {
    ok: true,
    series: replaceGame(series, commit(game, championKey, nowIso, true)),
    changed: true,
  };
}
