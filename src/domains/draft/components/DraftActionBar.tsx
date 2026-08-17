"use client";

import { stepAt } from "@/domains/draft";
import type { DraftGameState, ViewerRole } from "@/domains/draft";

interface DraftActionBarProps {
  game: DraftGameState;
  role: ViewerRole;
  selected: string | null;
  onCommit: () => void;
  onPassBan: () => void;
  onReady: (ready: boolean) => void;
  pending: boolean;
  /** Undo control, mounted by the shell where the turn history lives. */
  undo?: React.ReactNode;
}

function Pill({ ready, side }: { ready: boolean; side: "blue" | "red" }): React.JSX.Element {
  const accent = side === "blue" ? "border-accent-blue bg-accent-blue" : "border-danger bg-danger";
  return (
    <span
      className={`tag-cut border px-2 py-1 font-mono text-[9px] font-bold uppercase tracking-label ${
        ready ? `${accent} text-ink-1000` : "border-line-2 text-fg-3"
      }`}
    >
      {ready ? "Ready" : "Not ready"}
    </span>
  );
}

/**
 * The one place a drafter acts, pinned under the grid.
 *
 * Ready, lock and undo were spread between a lobby panel and the turn bar, so
 * the control you needed moved depending on the phase. They share a bar now,
 * with each side's ready state at the end it belongs to.
 */
export function DraftActionBar({
  game,
  role,
  selected,
  onCommit,
  onPassBan,
  onReady,
  pending,
  undo,
}: DraftActionBarProps): React.JSX.Element {
  const step = stepAt(game.step);
  const isDrafter = role !== "SPECTATOR";
  const lobby = game.phase === "LOBBY";
  const myTurn = game.phase === "IN_PROGRESS" && step?.side === role;
  const myReady = role === "BLUE" ? game.blueReady : game.redReady;

  return (
    <div className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-4 border-t border-line-1 bg-surface-dark px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Pill ready={game.blueReady} side="blue" />
        <span className="font-mono text-[9.5px] uppercase tracking-wide text-fg-4">Blue</span>
      </div>

      <div className="flex items-center gap-2">
        {lobby && isDrafter && (
          <button
            type="button"
            onClick={() => onReady(!myReady)}
            disabled={pending}
            className={`notch-sm px-6 py-2.5 font-display text-[13px] font-bold uppercase tracking-wide transition-colors disabled:opacity-40 ${
              myReady
                ? "border border-line-2 text-fg-2 hover:border-acid-500 hover:text-acid-500"
                : "btn-glow bg-acid-500 text-ink-1000 hover:bg-acid-400"
            }`}
          >
            {myReady ? "Cancel ready" : "Ready"}
          </button>
        )}

        {myTurn && step?.kind === "BAN" && (
          <button
            type="button"
            onClick={onPassBan}
            disabled={pending}
            className="notch-sm border border-line-2 px-4 py-2.5 font-mono text-[10px] uppercase tracking-label text-fg-3 transition-colors hover:border-acid-500 hover:text-acid-500 disabled:opacity-40"
          >
            Pass ban
          </button>
        )}

        {myTurn && (
          <button
            type="button"
            onClick={onCommit}
            disabled={!selected || pending}
            className="notch-sm btn-glow bg-acid-500 px-6 py-2.5 font-display text-[13px] font-bold uppercase tracking-wide text-ink-1000 transition-colors hover:bg-acid-400 disabled:opacity-40"
          >
            {pending
              ? "Locking…"
              : selected
                ? `Lock ${step?.kind === "BAN" ? "ban" : "pick"}`
                : "Select a champion"}
          </button>
        )}

        {!lobby && !myTurn && (
          <span className="font-mono text-[10px] uppercase tracking-label text-fg-4">
            {game.phase === "COMPLETE"
              ? "Draft complete"
              : isDrafter
                ? "Waiting for the other side"
                : "Watching"}
          </span>
        )}

        {undo}
      </div>

      <div className="flex items-center justify-end gap-2.5">
        <span className="font-mono text-[9.5px] uppercase tracking-wide text-fg-4">Red</span>
        <Pill ready={game.redReady} side="red" />
      </div>
    </div>
  );
}
