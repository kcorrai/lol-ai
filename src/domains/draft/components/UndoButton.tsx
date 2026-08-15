"use client";

import { Undo2 } from "lucide-react";
import type { DraftGameState, ViewerRole } from "@/domains/draft";

interface Props {
  game: DraftGameState;
  role: ViewerRole;
  onUndo: () => void;
  pending: boolean;
}

/**
 * Take back your own last lock.
 *
 * There is no consent flow and no timer, because the rule enforces its own
 * window: only the side that made the last action may undo it, so the button
 * disappears the moment the opponent locks. That is enough to fix a misclick and
 * not enough to rewind the enemy's pick.
 */
export function UndoButton({ game, role, onUndo, pending }: Props): React.ReactElement | null {
  if (role === "SPECTATOR" || game.phase === "LOBBY") return null;

  const last = game.actions[game.actions.length - 1];
  if (!last || last.side !== role) return null;

  return (
    <button
      type="button"
      onClick={onUndo}
      disabled={pending}
      className="notch-sm inline-flex items-center gap-1.5 border border-border px-2.5 py-1.5 text-[11.5px] font-semibold text-text-muted transition-colors hover:border-line-3 hover:text-text-body disabled:opacity-50"
    >
      <Undo2 className="h-3.5 w-3.5" aria-hidden />
      Undo {last.kind === "BAN" ? "ban" : "pick"}
    </button>
  );
}
