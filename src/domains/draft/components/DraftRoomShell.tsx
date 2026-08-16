"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import { buildDraftAdvice } from "@/domains/draft/advice/draftAdvice";
import { computeLaneEdges } from "@/domains/draft/advice/laneEdges";
import { useDraftActions } from "@/hooks/useDraftActions";
import { useDraftCatalog } from "@/hooks/useDraftCatalog";
import { useDraftCounters } from "@/hooks/useDraftCounters";
import { useDraftSummary } from "@/hooks/useDraftSummary";
import { useDraftSync } from "@/hooks/useDraftSync";
import { useDraftToken } from "@/hooks/useDraftToken";
import { DraftAdvicePanel } from "./DraftAdvicePanel";
import { DraftBoard } from "./DraftBoard";
import { DraftSummary } from "./DraftSummary";
import { JoinDraftPanel } from "./JoinDraftPanel";
import { LaneEdges } from "./LaneEdges";
import { ReadyCheck } from "./ReadyCheck";
import { SeriesOverview } from "./SeriesOverview";
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
  const [selected, setSelected] = useState<string | null>(null);

  const state = data?.state;
  const role = data?.role ?? "SPECTATOR";
  const game = state?.games.find((g) => g.gameNumber === gameNumber);

  // Only picks matter for matchups, and there are never more than ten.
  const pickKeys = useMemo(
    () =>
      (game?.actions ?? [])
        .filter((a) => a.kind === "PICK" && a.championKey)
        .map((a) => a.championKey as string),
    [game?.actions]
  );
  const { data: counters } = useDraftCounters(pickKeys);
  const { data: summary } = useDraftSummary(code, gameNumber, game?.phase === "COMPLETE");

  const advice = useMemo(
    () =>
      state && catalog && role !== "SPECTATOR"
        ? buildDraftAdvice(state, gameNumber, role, catalog, counters ?? {})
        : null,
    [state, catalog, role, gameNumber, counters]
  );

  const laneEdges = useMemo(
    () => (state && catalog ? computeLaneEdges(state, gameNumber, catalog, counters ?? {}) : []),
    [state, catalog, gameNumber, counters]
  );

  if (!ready || isLoading) {
    return <p className="p-8 text-center text-[13px] text-text-muted">Opening the room…</p>;
  }

  if (error || !state) {
    return (
      <div className="p-8 text-center">
        <p className="text-[14px] font-semibold text-text">This draft is not available.</p>
        <p className="mt-1 text-[13px] text-text-muted">
          The link may be mistyped, or the series may have expired — drafts are kept for seven days.
        </p>
      </div>
    );
  }

  const liveAndMine = role !== "SPECTATOR" && game?.phase === "IN_PROGRESS";

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
          selected={selected}
          onSelect={setSelected}
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
        >
          <DraftAdvicePanel
            advice={advice}
            patch={catalog.patch}
            onSelect={setSelected}
            visible={Boolean(liveAndMine)}
          />
          {game?.phase === "COMPLETE" && (
            <DraftSummary
              state={state}
              game={game}
              role={role}
              summary={summary}
              laneEdges={laneEdges}
              onSetWinner={actions.setWinner}
              pending={actions.pending}
            />
          )}
          <SeriesOverview state={state} gameNumber={gameNumber} />
          {liveAndMine && laneEdges.length > 0 && (
            <HudPanel className="p-4">
              <HudRule label="LANE EDGES" />
              <div className="mt-3">
                <LaneEdges edges={laneEdges} />
              </div>
            </HudPanel>
          )}
        </DraftBoard>
      ) : (
        <p className="p-8 text-center text-[13px] text-text-muted">Loading champions…</p>
      )}

      <HudPanel className="mt-6 max-w-md p-5">
        <HudRule label="YOUR SEAT" />
        <div className="mt-4">
          <JoinDraftPanel state={state} role={role} gameNumber={gameNumber} />
        </div>
      </HudPanel>
    </div>
  );
}
