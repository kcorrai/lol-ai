"use client";

import { useCallback, useMemo } from "react";
import { sideToAct, unavailableReason } from "@/domains/draft";
import type { DraftSeriesState, LegalityReason, ViewerRole } from "@/domains/draft";
import type { DraftCatalog } from "@/domains/draft/draftCatalog.types";
import { ChampionGrid } from "./ChampionGrid";
import { SeriesTabs } from "./SeriesTabs";
import { TeamColumn } from "./TeamColumn";
import { TurnIndicator } from "./TurnIndicator";
import { BanRail } from "./BanRail";

interface Props {
  state: DraftSeriesState;
  gameNumber: number;
  role: ViewerRole;
  catalog: DraftCatalog;
  selected: string | null;
  onSelect: (championKey: string | null) => void;
  onLock: (championKey: string | null) => void;
  pending: boolean;
  children?: React.ReactNode;
  clock?: React.ReactNode;
}

export function DraftBoard({
  state,
  gameNumber,
  role,
  catalog,
  selected,
  onSelect,
  onLock,
  pending,
  children,
  clock,
}: Props): React.ReactElement | null {
  const game = state.games.find((g) => g.gameNumber === gameNumber);

  // Availability is shown from the acting side's point of view, so a spectator
  // sees the same board the drafter is looking at rather than a third version.
  const viewSide = game ? (sideToAct(game.step) ?? "BLUE") : "BLUE";

  const reasonFor = useCallback(
    (key: string): LegalityReason | null => unavailableReason(state, gameNumber, viewSide, key),
    [state, gameNumber, viewSide]
  );

  const championsByKey = useMemo(
    () => new Map(catalog.champions.map((champion) => [champion.key, champion])),
    [catalog.champions]
  );

  const commit = useCallback(() => {
    if (!selected) return;
    onLock(selected);
    onSelect(null);
  }, [onLock, onSelect, selected]);

  if (!game) return null;

  const isMyTurn = game.phase === "IN_PROGRESS" && sideToAct(game.step) === role;

  return (
    <div className="notch flex flex-col overflow-hidden border border-border bg-background">
      <SeriesTabs state={state} gameNumber={gameNumber} />

      <TurnIndicator
        state={state}
        game={game}
        role={role}
        selected={selected}
        onCommit={commit}
        onPassBan={() => {
          onLock(null);
          onSelect(null);
        }}
        pending={pending}
      >
        {clock}
      </TurnIndicator>

      {/* Picks either side of the grid, the way the board is read. Below the
          breakpoint the columns fall above and below rather than squeezing to
          nothing, so the grid keeps the width it needs. */}
      <div className="grid gap-0 lg:grid-cols-[minmax(210px,1fr)_minmax(0,2.1fr)_minmax(210px,1fr)]">
        <div className="border-line-1 p-3 lg:border-r">
          <TeamColumn
            game={game}
            side="BLUE"
            ready={game.blueReady}
            teamName={game.blueTeam === 1 ? state.team1Name : state.team2Name}
            championsByKey={championsByKey}
          />
        </div>

        {/* Capped, not free-growing: a hundred and seventy champions at full
            height pushed the ban rail a screen and a half below the board, and
            what is banned is exactly what you need while picking. */}
        <div className="order-last flex min-h-[420px] flex-col gap-3 p-3 lg:order-none lg:max-h-[calc(100vh-260px)]">
          <ChampionGrid
            champions={catalog.champions}
            reasonFor={reasonFor}
            selected={selected}
            onSelect={onSelect}
            onCommit={commit}
            interactive={isMyTurn}
          />
          <div className="shrink-0">{children}</div>
        </div>

        <div className="border-line-1 p-3 lg:border-l">
          <TeamColumn
            game={game}
            side="RED"
            ready={game.redReady}
            teamName={game.blueTeam === 1 ? state.team2Name : state.team1Name}
            championsByKey={championsByKey}
          />
        </div>
      </div>

      <BanRail game={game} />
    </div>
  );
}
