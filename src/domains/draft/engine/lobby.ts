import type {
  DraftGameState,
  DraftSeriesState,
  DraftSide,
  TeamNumber,
  TransitionResult,
} from "./draft.types";
import { findGame, replaceGame } from "./stateUtils";

function bump(game: DraftGameState, patch: Partial<DraftGameState>): DraftGameState {
  return { ...game, ...patch, version: game.version + 1 };
}

/**
 * Toggle a side's ready flag. When both sides are ready the draft starts
 * immediately at step 0 — the visible 3-2-1 is a client animation, because a
 * server-side delay would need a timer we deliberately do not have (ADR-016).
 */
export function applyReady(
  series: DraftSeriesState,
  gameNumber: number,
  side: DraftSide,
  ready: boolean,
  nowIso: string
): TransitionResult {
  const game = findGame(series, gameNumber);
  if (!game) return { ok: false, reason: "unknown-game" };
  if (game.phase !== "LOBBY") return { ok: false, reason: "not-in-lobby" };

  const blueReady = side === "BLUE" ? ready : game.blueReady;
  const redReady = side === "RED" ? ready : game.redReady;
  if (blueReady === game.blueReady && redReady === game.redReady) {
    return { ok: true, series, changed: false };
  }

  const starting = blueReady && redReady;
  const next = bump(game, {
    blueReady,
    redReady,
    phase: starting ? "IN_PROGRESS" : "LOBBY",
    turnStartedAt: starting ? nowIso : null,
  });
  return { ok: true, series: replaceGame(series, next), changed: true };
}

/** Record which side won a finished game. Idempotent. */
export function applyGameResult(
  series: DraftSeriesState,
  gameNumber: number,
  winnerSide: DraftSide
): TransitionResult {
  const game = findGame(series, gameNumber);
  if (!game) return { ok: false, reason: "unknown-game" };
  if (game.phase !== "COMPLETE") return { ok: false, reason: "not-complete" };
  if (game.winnerSide === winnerSide) return { ok: true, series, changed: false };

  return { ok: true, series: replaceGame(series, bump(game, { winnerSide })), changed: true };
}

/**
 * Move a team onto blue side before the ready check. This is how "first
 * selection" is expressed: blue side always acts first in the sequence, so
 * giving a team first selection means seating it on blue.
 */
export function applyBlueTeam(
  series: DraftSeriesState,
  gameNumber: number,
  blueTeam: TeamNumber
): TransitionResult {
  const game = findGame(series, gameNumber);
  if (!game) return { ok: false, reason: "unknown-game" };
  if (game.phase !== "LOBBY") return { ok: false, reason: "not-in-lobby" };
  if (game.blueTeam === blueTeam) return { ok: true, series, changed: false };

  return { ok: true, series: replaceGame(series, bump(game, { blueTeam })), changed: true };
}
