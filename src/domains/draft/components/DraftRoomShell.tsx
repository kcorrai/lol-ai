"use client";

import { useSearchParams } from "next/navigation";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import { useDraftActions } from "@/hooks/useDraftActions";
import { useDraftCatalog } from "@/hooks/useDraftCatalog";
import { useDraftSync } from "@/hooks/useDraftSync";
import { useDraftToken } from "@/hooks/useDraftToken";
import { DraftBoard } from "./DraftBoard";
import { JoinDraftPanel } from "./JoinDraftPanel";
import { ReadyCheck } from "./ReadyCheck";
import { TurnClock } from "./TurnClock";
import { UndoButton } from "./UndoButton";

interface Props {
  code: string;
}

const MODE_LABEL: Record<string, string> = {
  NORMAL: "Normal",
  FEARLESS: "Fearless",
  TEAM_FEARLESS: "Team fearless",
};

export function DraftRoomShell({ code }: Props): React.ReactElement {
  const params = useSearchParams();
  const gameNumber = Math.max(1, Number(params.get("game") ?? "1") || 1);
  const { token, ready } = useDraftToken(code);
  const { data, isLoading, error, skewMs } = useDraftSync(code, gameNumber, token);
  const { data: catalog } = useDraftCatalog();
  const actions = useDraftActions(code, gameNumber, token);

  if (!ready || isLoading) {
    return <p className="p-8 text-center text-[13px] text-text-muted">Opening the room…</p>;
  }

  if (error || !data) {
    return (
      <div className="p-8 text-center">
        <p className="text-[14px] font-semibold text-text">This draft is not available.</p>
        <p className="mt-1 text-[13px] text-text-muted">
          The link may be mistyped, or the series may have expired — drafts are kept for seven days.
        </p>
      </div>
    );
  }

  const { state, role } = data;
  const game = state.games.find((g) => g.gameNumber === gameNumber);

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8">
      <header className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-text">
          {state.team1Name} <span className="text-text-faint">vs</span> {state.team2Name}
        </h1>
        <p className="hud-label">
          {MODE_LABEL[state.mode]} · Bo{state.gameCount} ·{" "}
          {state.timerSeconds === 0 ? "Untimed" : `${state.timerSeconds}s`}
        </p>
      </header>

      {actions.error && (
        <p role="alert" className="mb-3 text-[13px] text-danger">
          {actions.error}
        </p>
      )}

      {game?.phase === "LOBBY" && (
        <div className="mb-4">
          <ReadyCheck
            state={state}
            game={game}
            role={role}
            onReady={actions.setReady}
            onSwapSides={actions.setBlueTeam}
            pending={actions.pending}
          />
        </div>
      )}

      {catalog ? (
        <DraftBoard
          state={state}
          gameNumber={gameNumber}
          role={role}
          catalog={catalog}
          onLock={actions.lock}
          pending={actions.pending}
          clock={
            game && (
              <>
                <UndoButton
                  game={game}
                  role={role}
                  onUndo={actions.undo}
                  pending={actions.pending}
                />
                <TurnClock state={state} game={game} skewMs={skewMs} />
              </>
            )
          }
        />
      ) : (
        <p className="p-8 text-center text-[13px] text-text-muted">Loading champions…</p>
      )}

      <HudPanel className="mt-6 max-w-md p-5">
        <HudRule label="YOUR SEAT" />
        <div className="mt-4">
          <JoinDraftPanel state={state} role={role} />
        </div>
      </HudPanel>
    </div>
  );
}
