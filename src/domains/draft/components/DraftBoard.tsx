"use client";

import { useCallback, useMemo } from "react";
import { sideToAct, unavailableReason } from "@/domains/draft";
import type { DraftSeriesState, LegalityReason, ViewerRole } from "@/domains/draft";
import type { DraftCatalog } from "@/domains/draft/draftCatalog.types";
import { ChampionGrid } from "./ChampionGrid";
import { TeamColumn } from "./TeamColumn";
import { TurnIndicator } from "./TurnIndicator";
import { BanRail } from "./BanRail";
import { CoachStrip } from "./CoachStrip";
import { DraftActionBar } from "./DraftActionBar";

interface Props {
  state: DraftSeriesState;
  gameNumber: number;
  role: ViewerRole;
  catalog: DraftCatalog;
  selected: string | null;
  onSelect: (championKey: string | null) => void;
  onLock: (championKey: string | null) => void;
  onReady: (ready: boolean) => void;
  pending: boolean;
  clock?: React.ReactNode;
  undo?: React.ReactNode;
}

/**
 * The board owns the viewport.
 *
 * Turn bar, picks, grid and bans are all one screen: the grid is the only thing
 * that scrolls, so a drafter never loses sight of what is banned or whose turn
 * it is. Below the breakpoint the pinning is dropped and the whole thing
 * becomes a normal scrolling page, because a 300px-tall grid is worse than a
 * long page.
 */
export function DraftBoard({
  state,
  gameNumber,
  role,
  catalog,
  selected,
  onSelect,
  onLock,
  onReady,
  pending,
  clock,
  undo,
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

  const passBan = useCallback(() => {
    onLock(null);
    onSelect(null);
  }, [onLock, onSelect]);

  if (!game) return null;

  const isMyTurn = game.phase === "IN_PROGRESS" && sideToAct(game.step) === role;

  return (
    <div className="flex flex-col lg:h-screen lg:overflow-hidden">
      <TurnIndicator state={state} game={game} role={role} selected={selected}>
        {clock}
      </TurnIndicator>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[minmax(210px,1fr)_minmax(0,2.1fr)_minmax(210px,1fr)]">
        <div className="min-h-0 border-line-1 p-3 lg:border-r">
          <TeamColumn game={game} side="BLUE" championsByKey={championsByKey} />
        </div>

        <div className="order-last flex min-h-0 flex-col border-line-1 max-lg:border-y lg:order-none">
          <CoachStrip game={game} role={role} />

          <div className="flex min-h-[380px] flex-1 flex-col p-3 lg:min-h-0">
            <ChampionGrid
              champions={catalog.champions}
              reasonFor={reasonFor}
              selected={selected}
              onSelect={onSelect}
              onCommit={commit}
              interactive={isMyTurn}
            />
          </div>

          <DraftActionBar
            game={game}
            role={role}
            selected={selected}
            onCommit={commit}
            onPassBan={passBan}
            onReady={onReady}
            pending={pending}
            undo={undo}
          />
        </div>

        <div className="min-h-0 border-line-1 p-3 lg:border-l">
          <TeamColumn game={game} side="RED" championsByKey={championsByKey} />
        </div>
      </div>

      <BanRail game={game} />
    </div>
  );
}
