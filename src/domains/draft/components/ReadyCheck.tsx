"use client";

import { Button } from "@/components/ui/button";
import { teamOnSide } from "@/domains/draft";
import type { DraftGameState, DraftSeriesState, TeamNumber, ViewerRole } from "@/domains/draft";

interface Props {
  state: DraftSeriesState;
  game: DraftGameState;
  role: ViewerRole;
  onReady: (ready: boolean) => void;
  onSwapSides: (blueTeam: TeamNumber) => void;
  pending: boolean;
}

/**
 * The gate before step 0. Both sides confirm, and only then does the clock
 * start — which is also the last moment either drafter can change who sits on
 * blue side for this game.
 */
export function ReadyCheck({
  state,
  game,
  role,
  onReady,
  onSwapSides,
  pending,
}: Props): React.ReactElement {
  const isDrafter = role !== "SPECTATOR";
  const myReady = role === "BLUE" ? game.blueReady : game.redReady;
  const theirReady = role === "BLUE" ? game.redReady : game.blueReady;
  const blueName = game.blueTeam === 1 ? state.team1Name : state.team2Name;
  const redName = game.blueTeam === 1 ? state.team2Name : state.team1Name;

  return (
    <div className="notch-sm flex flex-col gap-3 border border-border bg-surface-2 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-[15px] font-bold text-text">
            Game {game.gameNumber} — ready check
          </p>
          <p className="text-[11.5px] text-text-muted">
            <span className="text-accent-blue">{blueName}</span> on blue,{" "}
            <span className="text-danger">{redName}</span> on red. Blue picks first.
          </p>
        </div>

        {isDrafter ? (
          <Button
            type="button"
            variant={myReady ? "outline" : "default"}
            onClick={() => onReady(!myReady)}
            disabled={pending}
          >
            {myReady ? "Cancel ready" : "Ready"}
          </Button>
        ) : (
          <span className="text-[12px] text-text-muted">
            {game.blueReady && game.redReady ? "Starting…" : "Waiting for both sides"}
          </span>
        )}
      </div>

      {isDrafter && (
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-3">
          <span className="text-[11.5px] text-text-muted">
            {myReady
              ? theirReady
                ? "Both sides ready."
                : "Waiting for the other side."
              : "Ready up when your team is set."}
          </span>
          {!game.blueReady && !game.redReady && (
            <button
              type="button"
              onClick={() => onSwapSides(teamOnSide(game, "RED"))}
              disabled={pending}
              className="text-[11.5px] font-semibold text-accent underline-offset-4 hover:underline"
            >
              Swap sides
            </button>
          )}
        </div>
      )}
    </div>
  );
}
