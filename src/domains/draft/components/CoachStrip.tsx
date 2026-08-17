"use client";

import { DRAFT_SEQUENCE, stepAt } from "@/domains/draft";
import type { DraftGameState, ViewerRole } from "@/domains/draft";

interface CoachStripProps {
  game: DraftGameState;
  role: ViewerRole;
}

/**
 * One line of coaching above the grid.
 *
 * The advice panel under the board answers "what should I take"; this answers
 * "what is happening", which is the question you have while your eyes are
 * still on the grid. It never repeats a number the panel is about to give.
 */
export function CoachStrip({ game, role }: CoachStripProps): React.JSX.Element {
  const step = stepAt(game.step);
  const total = DRAFT_SEQUENCE.length;

  // Derived from the phase, not from the advice engine: `DraftAdvice` ranks
  // champions and has no one-line reading of the turn, and writing one here
  // would be prose the numbers underneath do not actually support.
  const line =
    game.phase === "LOBBY"
      ? "Ready up when both sides are set. Blue bans first."
      : game.phase === "COMPLETE"
        ? "Draft complete. The comp readout below is the whole board."
        : step?.side === role
          ? `Your ${step.kind === "BAN" ? "ban" : "pick"}. Choose a champion, then lock it in.`
          : "The other side is on the clock.";

  const counter =
    game.phase === "COMPLETE"
      ? `${total} of ${total}`
      : step
        ? `${game.step + 1} of ${total} · ${step.kind}`
        : "";

  return (
    <div className="flex shrink-0 items-center gap-3 border-b border-line-1 bg-acid-500/10 px-4 py-2.5">
      <span className="h-1.5 w-1.5 shrink-0 animate-glow-pulse bg-acid-500" />
      <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-label text-acid-500">
        {"// COACH"}
      </span>
      <span className="min-w-0 truncate text-[13.5px] text-fg-1">{line}</span>
      {counter && (
        <span className="ml-auto shrink-0 font-mono text-[9.5px] uppercase tracking-wide text-fg-3">
          {counter}
        </span>
      )}
    </div>
  );
}
