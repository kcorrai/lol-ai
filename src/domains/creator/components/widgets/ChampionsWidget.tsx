"use client";

import type { OverlayPayload } from "@/domains/creator/types";
import {
  OverlayBadge,
  OverlayLabel,
  OverlayShell,
} from "@/domains/creator/components/widgets/OverlayShell";

// Answers "what do you play?" without the streamer stopping to say it.

export function ChampionsWidget({ payload }: { payload: OverlayPayload }): JSX.Element {
  const champions = payload.champions;

  if (champions.length === 0) {
    return (
      <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
        <OverlayLabel>Champion pool</OverlayLabel>
        <span className="font-display text-xl">No games yet</span>
        <OverlayBadge />
      </OverlayShell>
    );
  }

  return (
    <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
      <OverlayLabel>Most played</OverlayLabel>
      <ul className="flex flex-col gap-0.5">
        {champions.map((champion) => (
          <li key={champion.championId} className="flex items-baseline gap-3">
            <span className="min-w-[7rem] font-display text-base leading-tight">
              {champion.championName}
            </span>
            <span className="font-mono text-sm text-fg-2">
              {champion.games}g · {champion.winRate}% · {champion.kda.toFixed(2)} KDA
            </span>
          </li>
        ))}
      </ul>
      <OverlayBadge />
    </OverlayShell>
  );
}
