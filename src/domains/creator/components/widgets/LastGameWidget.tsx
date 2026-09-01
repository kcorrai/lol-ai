"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { OverlayPayload } from "@/domains/creator/types";
import {
  OverlayBadge,
  OverlayLabel,
  OverlayShell,
} from "@/domains/creator/components/widgets/OverlayShell";

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, "0")}`;
}

// Fills the gap between games, which is exactly when a stream has nothing on it.

export function LastGameWidget({ payload }: { payload: OverlayPayload }): JSX.Element {
  const game = payload.lastGame;

  if (!game) {
    return (
      <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
        <OverlayLabel>Last game</OverlayLabel>
        <span className="font-display text-2xl font-extrabold">Nothing yet</span>
        <OverlayBadge />
      </OverlayShell>
    );
  }

  return (
    <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
      <OverlayLabel>Last game · {game.queueLabel}</OverlayLabel>
      <div className="mt-1.5 flex items-center gap-3">
        {/* The portrait is read from across a room; the name is not. */}
        <ChampionIcon name={game.championName} size={34} />
        <span className="font-display text-[26px] font-extrabold leading-none">
          {game.championName}
        </span>
        <span
          className={`font-display text-xl font-extrabold leading-none tracking-wider ${game.win ? "text-success" : "text-danger"}`}
        >
          {game.win ? "WIN" : "LOSS"}
        </span>
      </div>
      <span className="mt-1.5 font-mono text-sm text-fg-2">
        {game.kills}/{game.deaths}/{game.assists} · {game.csPerMinute.toFixed(1)} CS/min ·{" "}
        {formatDuration(game.durationSeconds)}
      </span>
      <OverlayBadge />
    </OverlayShell>
  );
}
