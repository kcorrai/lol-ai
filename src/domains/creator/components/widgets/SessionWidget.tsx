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
        <span className="font-display text-2xl font-extrabold">No games yet</span>
      ) : (
        <>
          <div className="mt-1 flex items-baseline gap-3">
            <OverlayAccent>
              <span className="font-display text-[32px] font-extrabold leading-none">
                {session.wins}W
              </span>
            </OverlayAccent>
            <span className="font-mono text-base leading-none text-fg-4">·</span>
            <span className="font-display text-[32px] font-extrabold leading-none text-danger">
              {session.losses}L
            </span>
            <OverlayAccent>
              <span className="font-mono text-xl font-bold leading-none">{session.winRate}%</span>
            </OverlayAccent>
          </div>
          <span className="mt-1 font-mono text-sm text-fg-2">
            {session.kills}/{session.deaths}/{session.assists} · {session.kda?.toFixed(2)} KDA
          </span>
        </>
      )}
      <OverlayBadge />
    </OverlayShell>
  );
}
