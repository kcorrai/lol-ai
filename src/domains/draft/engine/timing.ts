import type { DraftGameState, DraftSeriesState } from "./draft.types";
import { isComplete } from "./sequence";

// `now` is always injected. Nothing in the engine reads the clock itself, so a
// transition replays identically on the server and in an optimistic client echo.

function isTimed(series: DraftSeriesState, game: DraftGameState): boolean {
  return (
    series.timerSeconds > 0 &&
    game.phase === "IN_PROGRESS" &&
    !isComplete(game.step) &&
    game.turnStartedAt !== null
  );
}

/** Epoch ms the current turn expires, or null when the turn cannot expire. */
export function turnDeadlineMs(
  series: DraftSeriesState,
  game: DraftGameState
): number | null {
  if (!isTimed(series, game) || !game.turnStartedAt) return null;
  return Date.parse(game.turnStartedAt) + series.timerSeconds * 1000;
}

/** Milliseconds left on the current turn, floored at 0, or null when untimed. */
export function remainingMs(
  series: DraftSeriesState,
  game: DraftGameState,
  nowMs: number
): number | null {
  const deadline = turnDeadlineMs(series, game);
  if (deadline === null) return null;
  return Math.max(0, deadline - nowMs);
}

export function hasExpired(
  series: DraftSeriesState,
  game: DraftGameState,
  nowMs: number
): boolean {
  const deadline = turnDeadlineMs(series, game);
  return deadline !== null && nowMs >= deadline;
}
