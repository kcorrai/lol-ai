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
        <span className="font-display text-xl">Unranked</span>
        <OverlayBadge />
      </OverlayShell>
    );
  }

  const delta = rank.sessionLpDelta;

  return (
    <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
      <OverlayLabel>{identity.name ?? "Rank"}</OverlayLabel>
      <div className="flex items-baseline gap-2">
        <span className="font-display text-2xl leading-none">{rank.label}</span>
        <OverlayAccent>
          <span className="font-mono text-lg leading-none">{rank.lp} LP</span>
        </OverlayAccent>
      </div>
      {delta !== null && (
        <span
          className={`font-mono text-sm ${delta > 0 ? "text-success" : delta < 0 ? "text-danger" : "text-fg-3"}`}
        >
          {formatLpDelta(delta)} LP this session
        </span>
      )}
      <OverlayBadge />
    </OverlayShell>
  );
}
