"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
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
        <span className="font-display text-2xl font-extrabold">No games yet</span>
        <OverlayBadge />
      </OverlayShell>
    );
  }

  return (
    <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
      <OverlayLabel>Most played</OverlayLabel>
      <ul className="mt-2 flex flex-col gap-1.5">
        {champions.map((champion) => (
          <li
            key={champion.championId}
            className="grid grid-cols-[26px_1fr_max-content] items-center gap-3"
          >
            <ChampionIcon name={champion.championName} size={26} />
            <span className="font-display text-base font-bold leading-tight">
              {champion.championName}
            </span>
            <span className="font-mono text-[13px] text-fg-2">
              {champion.games}g · {champion.winRate}% · {champion.kda.toFixed(2)} KDA
            </span>
          </li>
        ))}
      </ul>
      <OverlayBadge />
    </OverlayShell>
  );
}
