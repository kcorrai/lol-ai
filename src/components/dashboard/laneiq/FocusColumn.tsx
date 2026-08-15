"use client";

import { useTodaysFocus } from "@/hooks/useTodaysFocus";
import { StatBlock } from "./HudPanel";
import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";

interface FocusColumnProps {
  riotAccountId: string | null | undefined;
  profile: PlayerPerformanceProfile | undefined;
}

export function FocusColumn({ riotAccountId, profile }: FocusColumnProps): React.ReactElement {
  const { data: focus, isLoading } = useTodaysFocus(riotAccountId);

  const visionPerMin = profile?.avgMetrics.visionScorePerMinute;

  return (
    <div className="flex flex-col border-b border-border p-6 lg:border-b-0 lg:border-r">
      <p className="hud-label">{"// Today's focus"}</p>

      {isLoading ? (
        <div className="mt-4 h-24 animate-pulse bg-surface-dark" />
      ) : focus ? (
        <>
          <p className="mb-2.5 mt-3.5 font-display text-[21px] font-extrabold uppercase leading-[1.15] text-text">
            {focus.action}
          </p>
          <p className="mb-4 max-w-[44ch] text-sm text-text-body">{focus.howTo}</p>

          <div className="mt-auto flex flex-wrap gap-6 border-t border-border pt-4">
            <StatBlock label="Expected impact" value={focus.expectedImpact} />
            <StatBlock label="Timeframe" value={focus.timeframe} />
            {visionPerMin !== undefined && (
              <StatBlock label="Vision/min" value={visionPerMin.toFixed(2)} />
            )}
          </div>
        </>
      ) : (
        <div className="mt-4 border border-dashed border-line-2 p-6 text-center">
          <p className="font-display text-base font-bold uppercase tracking-[0.04em] text-text">
            No focus yet
          </p>
          <p className="mx-auto mt-2 max-w-[44ch] text-[13.5px] text-text-body">
            Your first coaching report sets the one habit to work on. It lands about 90 seconds
            after the pull finishes.
          </p>
        </div>
      )}
    </div>
  );
}
