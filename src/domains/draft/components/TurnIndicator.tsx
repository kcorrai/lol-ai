"use client";

import { stepAt } from "@/domains/draft";
import type { DraftGameState, DraftSeriesState, ViewerRole } from "@/domains/draft";

interface Props {
  state: DraftSeriesState;
  game: DraftGameState;
  role: ViewerRole;
  selected: string | null;
  children?: React.ReactNode;
}

function actingName(state: DraftSeriesState, game: DraftGameState): string | null {
  const step = stepAt(game.step);
  if (!step) return null;
  const team = step.side === "BLUE" ? game.blueTeam : game.blueTeam === 1 ? 2 : 1;
  return team === 1 ? state.team1Name : state.team2Name;
}

function turnLabel(state: DraftSeriesState, game: DraftGameState): string {
  const step = stepAt(game.step);
  if (game.phase === "COMPLETE") return "Draft complete";
  if (game.phase === "LOBBY" || !step) return "Ready check";
  return `${actingName(state, game)} to ${step.kind === "BAN" ? "ban" : "pick"}`;
}

/**
 * Whose turn it is, and the only way to commit.
 *
 * A single click on the grid selects; locking takes a second, deliberate action.
 * Under a 30-second clock a misclick is unrecoverable, and the reference tool's
 * click-to-lock is the one interaction people ask to have back.
 *
 * The bar reads left-to-right as the board does: blue, whose turn it is, red.
 * Naming both sides here is what lets the pick columns drop their own headers.
 *
 * It states the turn and nothing else — committing lives in the action bar
 * under the grid, where the champion you are about to lock is still in view.
 */
export function TurnIndicator({
  state,
  game,
  role,
  selected,
  children,
}: Props): React.ReactElement {
  const step = stepAt(game.step);
  const isMyTurn = game.phase === "IN_PROGRESS" && step?.side === role;
  const complete = game.phase === "COMPLETE";
  const lobby = game.phase === "LOBBY";

  const blueName = game.blueTeam === 1 ? state.team1Name : state.team2Name;
  const redName = game.blueTeam === 1 ? state.team2Name : state.team1Name;

  const badgeClass = complete
    ? "border-acid-500 bg-acid-500/10 text-acid-500"
    : lobby
      ? "border-warning bg-warning/10 text-warning"
      : step?.side === "BLUE"
        ? "border-accent-blue bg-accent-blue text-ink-1000"
        : "border-danger bg-danger text-ink-1000";

  return (
    <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-b border-line-1 bg-surface/70 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex min-w-0 items-baseline gap-3">
        <span className="truncate font-display text-lg font-black uppercase tracking-wide text-accent-blue">
          {blueName}
        </span>
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-label text-fg-4 sm:inline">
          blue side
        </span>
      </div>

      <div className="text-center">
        <div
          className={`tag-cut inline-block border px-3.5 py-1.5 font-display text-[13px] font-extrabold uppercase tracking-wider ${badgeClass}`}
        >
          {turnLabel(state, game)}
        </div>
        <div className="mt-2 flex items-center justify-center gap-3">
          <span className="font-mono text-[10px] uppercase tracking-label text-fg-4">
            {isMyTurn
              ? selected
                ? "Lock it in"
                : "Choose a champion"
              : role === "SPECTATOR"
                ? "Watching"
                : lobby
                  ? "Both sides must ready"
                  : "Waiting for the other side"}
          </span>
          {children && (
            <>
              <span className="h-3 w-px bg-line-2" />
              {children}
            </>
          )}
        </div>
      </div>

      <div className="flex min-w-0 items-baseline justify-end gap-3">
        <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-label text-fg-4 sm:inline">
          red side
        </span>
        <span className="truncate font-display text-lg font-black uppercase tracking-wide text-danger">
          {redName}
        </span>
      </div>

    </div>
  );
}
