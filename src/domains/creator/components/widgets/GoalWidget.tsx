"use client";

import type { OverlayPayload } from "@/domains/creator/types";
import {
  OverlayAccent,
  OverlayBadge,
  OverlayLabel,
  OverlayShell,
} from "@/domains/creator/components/widgets/OverlayShell";

// The climb bar. Progress is measured from where the session opened rather than
// from Iron IV, so a Diamond player chasing Master does not start at 95% full.

export function GoalWidget({ payload }: { payload: OverlayPayload }): JSX.Element {
  const { goal, rank } = payload;

  if (!goal || !rank) {
    return (
      <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
        <OverlayLabel>Goal</OverlayLabel>
        <span className="font-display text-2xl font-extrabold">No goal set</span>
        <OverlayBadge />
      </OverlayShell>
    );
  }

  const reached = goal.lpRemaining === 0;

  return (
    <OverlayShell accentColor={payload.accentColor} theme={payload.theme}>
      <OverlayLabel>Road to {goal.label}</OverlayLabel>
      <div className="mt-1.5 flex items-baseline gap-3">
        <span className="font-display text-[26px] font-extrabold leading-none">{rank.label}</span>
        <span className="font-mono text-lg leading-none text-fg-4">→</span>
        <span className="font-display text-[26px] font-extrabold leading-none">{goal.label}</span>
      </div>

      <div
        className="mt-3.5 h-[9px] w-56 max-w-full overflow-hidden bg-[rgba(233,245,238,.10)]"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(goal.progress * 100)}
        aria-label={`Progress to ${goal.label}`}
      >
        <div
          className="h-full transition-[width] duration-500"
          style={{
            width: `${Math.round(goal.progress * 100)}%`,
            backgroundColor: "var(--overlay-accent)",
          }}
        />
      </div>

      <span className="mt-2.5 font-mono text-sm text-fg-2">
        {reached ? <OverlayAccent>Goal reached</OverlayAccent> : `${goal.lpRemaining} LP to go`}
      </span>
      <OverlayBadge />
    </OverlayShell>
  );
}
