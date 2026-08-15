"use client";

import { useCallback, useState } from "react";
import { sideToAct, unavailableReason } from "@/domains/draft";
import type { DraftSeriesState, LegalityReason, ViewerRole } from "@/domains/draft";
import type { DraftCatalog } from "@/domains/draft/draftCatalog.types";
import { ChampionGrid } from "./ChampionGrid";
import { SeriesTabs } from "./SeriesTabs";
import { TeamColumn } from "./TeamColumn";
import { TurnIndicator } from "./TurnIndicator";

interface Props {
  state: DraftSeriesState;
  gameNumber: number;
  role: ViewerRole;
  catalog: DraftCatalog;
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
  onLock,
  pending,
  children,
  clock,
}: Props): React.ReactElement | null {
  const [selected, setSelected] = useState<string | null>(null);
  const game = state.games.find((g) => g.gameNumber === gameNumber);

  // Availability is shown from the acting side's point of view, so a spectator
  // sees the same board the drafter is looking at rather than a third version.
  const viewSide = game ? (sideToAct(game.step) ?? "BLUE") : "BLUE";
  const knownKeys = new Set(catalog.champions.map((c) => c.key.toLowerCase()));

  const reasonFor = useCallback(
    (key: string): LegalityReason | null =>
      unavailableReason(state, gameNumber, viewSide, key, knownKeys),
    // `knownKeys` is derived from the catalogue, which is fetched once per room.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state, gameNumber, viewSide]
  );

  const commit = useCallback(() => {
    if (!selected) return;
    onLock(selected);
    setSelected(null);
  }, [onLock, selected]);

  if (!game) return null;

  const step = sideToAct(game.step);
  const isMyTurn = game.phase === "IN_PROGRESS" && step === role;

  return (
    <div className="flex flex-col gap-4">
      <SeriesTabs state={state} gameNumber={gameNumber} />

      <TurnIndicator
        state={state}
        game={game}
        role={role}
        selected={selected}
        onCommit={commit}
        onPassBan={() => {
          onLock(null);
          setSelected(null);
        }}
        pending={pending}
      >
        {clock}
      </TurnIndicator>

      <div className="grid gap-4 lg:grid-cols-[auto_1fr_auto]">
        <TeamColumn
          game={game}
          side="BLUE"
          ready={game.blueReady}
          teamName={game.blueTeam === 1 ? state.team1Name : state.team2Name}
        />

        <div className="order-last flex min-h-[420px] flex-col gap-4 lg:order-none">
          <ChampionGrid
            champions={catalog.champions}
            reasonFor={reasonFor}
            selected={selected}
            onSelect={setSelected}
            onCommit={commit}
            interactive={isMyTurn}
          />
          {children}
        </div>

        <TeamColumn
          game={game}
          side="RED"
          ready={game.redReady}
          teamName={game.blueTeam === 1 ? state.team2Name : state.team1Name}
        />
      </div>
    </div>
  );
}
