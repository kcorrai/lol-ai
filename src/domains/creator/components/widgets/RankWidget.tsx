"use client";

import { formatLpDelta } from "@/domains/creator/lp";
import type { OverlayPayload } from "@/domains/creator/types";
import {
  OverlayAccent,
  OverlayBadge,
  OverlayLabel,
  OverlayShell,
} from "@/domains/creator/components/widgets/OverlayShell";

// Rank, LP, and what the session has done to it — the figure chat asks for most.

export function RankWidget({ payload }: { payload: OverlayPayload }): JSX.Element {
  const { rank, identity } = payload;

  if (!rank) {
    return (
      <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
        <OverlayLabel>Rank</OverlayLabel>
        <span className="font-display text-2xl font-extrabold">Unranked</span>
        <OverlayBadge />
      </OverlayShell>
    );
  }

  const delta = rank.sessionLpDelta;

  return (
    <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
      <OverlayLabel>{identity.name ?? "Rank"}</OverlayLabel>
      <div className="mt-1 flex items-baseline gap-2.5">
        <span className="font-display text-[30px] font-extrabold leading-none">{rank.label}</span>
        <OverlayAccent>
          <span className="font-mono text-[22px] font-bold leading-none">{rank.lp} LP</span>
        </OverlayAccent>
      </div>
      {delta !== null &&
        // A loss stays red rather than taking the creator's accent: the accent
        // is a brand colour, and colouring a drop with it reads as a gain.
        (delta < 0 ? (
          <span className="mt-1 font-mono text-[15px] text-danger">
            {formatLpDelta(delta)} LP this session
          </span>
        ) : (
          <OverlayAccent>
            <span className="mt-1 block font-mono text-[15px]">
              {formatLpDelta(delta)} LP this session
            </span>
          </OverlayAccent>
        ))}
      <OverlayBadge />
    </OverlayShell>
  );
}
