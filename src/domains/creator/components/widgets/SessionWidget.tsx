"use client";

import type { OverlayPayload } from "@/domains/creator/types";
import {
  OverlayAccent,
  OverlayBadge,
  OverlayLabel,
  OverlayShell,
} from "@/domains/creator/components/widgets/OverlayShell";

// "Today: 7W 3L · 70% · 4.2 KDA". The classic stream counter.

export function SessionWidget({ payload }: { payload: OverlayPayload }): JSX.Element {
  const { session } = payload;

  return (
    <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
      <OverlayLabel>Session</OverlayLabel>

      {session.games === 0 ? (
        <span className="font-display text-xl">No games yet</span>
      ) : (
        <>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl leading-none">
              <span className="text-success">{session.wins}W</span>
              <span className="mx-1 text-fg-4">·</span>
              <span className="text-danger">{session.losses}L</span>
            </span>
            <OverlayAccent>
              <span className="font-mono text-lg leading-none">{session.winRate}%</span>
            </OverlayAccent>
          </div>
          <span className="font-mono text-sm text-fg-2">
            {session.kills}/{session.deaths}/{session.assists} · {session.kda?.toFixed(2)} KDA
          </span>
        </>
      )}
      <OverlayBadge />
    </OverlayShell>
  );
}
