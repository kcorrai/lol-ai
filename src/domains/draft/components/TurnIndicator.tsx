"use client";

import { Button } from "@/components/ui/button";
import { stepAt } from "@/domains/draft";
import type { DraftGameState, DraftSeriesState, ViewerRole } from "@/domains/draft";

interface Props {
  state: DraftSeriesState;
  game: DraftGameState;
  role: ViewerRole;
  selected: string | null;
  onCommit: () => void;
  onPassBan: () => void;
  pending: boolean;
  children?: React.ReactNode;
}

function turnLabel(state: DraftSeriesState, game: DraftGameState): string {
  const step = stepAt(game.step);
  if (game.phase === "COMPLETE") return "Draft complete";
  if (game.phase === "LOBBY" || !step) return "Waiting for both sides";
  const team = step.side === "BLUE" ? game.blueTeam : game.blueTeam === 1 ? 2 : 1;
  const name = team === 1 ? state.team1Name : state.team2Name;
  return `${name} — ${step.kind === "BAN" ? "ban" : "pick"} ${step.slot + 1}`;
}

/**
 * Whose turn it is, and the only way to commit.
 *
 * A single click on the grid selects; locking takes a second, deliberate action.
 * Under a 30-second clock a misclick is unrecoverable, and the reference tool's
 * click-to-lock is the one interaction people ask to have back.
 */
export function TurnIndicator({
  state,
  game,
  role,
  selected,
  onCommit,
  onPassBan,
  pending,
  children,
}: Props): React.ReactElement {
  const step = stepAt(game.step);
  const isMyTurn = game.phase === "IN_PROGRESS" && step?.side === role;
  const accent = step?.side === "BLUE" ? "text-accent-blue" : "text-danger";

  return (
    <div className="notch-sm flex flex-wrap items-center justify-between gap-3 border border-border bg-surface-2 px-4 py-3">
      <div className="min-w-0">
        <p className={`truncate font-display text-[15px] font-bold ${accent}`}>
          {turnLabel(state, game)}
        </p>
        <p className="text-[11.5px] text-text-muted">
          {isMyTurn
            ? selected
              ? "Lock it in, or pick a different champion."
              : "Choose a champion, then lock it in."
            : role === "SPECTATOR"
              ? "Watching"
              : "Waiting for the other side"}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {children}
        {isMyTurn && step?.kind === "BAN" && (
          <Button type="button" variant="ghost" size="sm" onClick={onPassBan} disabled={pending}>
            Pass ban
          </Button>
        )}
        {isMyTurn && (
          <Button type="button" onClick={onCommit} disabled={!selected || pending}>
            {pending ? "Locking…" : "Lock in"}
          </Button>
        )}
      </div>
    </div>
  );
}
