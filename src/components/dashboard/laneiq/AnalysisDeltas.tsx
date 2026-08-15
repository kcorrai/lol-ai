"use client";

import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";

interface Aggregate {
  label: string;
  /** Absent until there is a previous period to compare against. */
  delta: number | undefined;
  /** Formats both the current and the derived previous value. */
  format: (v: number) => string;
  current: number;
}

// The delta is the story and the raw number is the footnote, so the delta gets the
// 30px mono treatment and "now / was" sits under it (ADR-015).
function buildAggregates(profile: PlayerPerformanceProfile): Aggregate[] {
  const d = profile.delta;
  const m = profile.avgMetrics;
  return [
    {
      label: "Win rate",
      delta: d?.winRate,
      current: profile.winRate,
      format: (v) => `${v.toFixed(1)}%`,
    },
    { label: "Avg KDA", delta: d?.kda, current: m.kda, format: (v) => v.toFixed(2) },
    {
      label: "CS / min",
      delta: d?.csPerMinute,
      current: m.csPerMinute,
      format: (v) => v.toFixed(1),
    },
    {
      label: "Vision score",
      delta: d?.visionScore,
      // MetricDelta.visionScore is an absolute vision score, and avgMetrics only
      // carries the per-minute rate — so average the real per-match scores rather
      // than deriving one from the rate and an assumed game length.
      current: profile.recentMatches.length
        ? profile.recentMatches.reduce((sum, x) => sum + x.visionScore, 0) /
          profile.recentMatches.length
        : 0,
      format: (v) => v.toFixed(1),
    },
  ];
}

export function AnalysisDeltas({
  profile,
  isLoading,
}: {
  profile: PlayerPerformanceProfile | undefined;
  isLoading: boolean;
}): React.ReactElement | null {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="notch h-[104px] animate-pulse border border-border bg-surface" />
        ))}
      </div>
    );
  }
  if (!profile) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {buildAggregates(profile).map((a) => {
        // No previous period yet — show the value plainly rather than inventing a
        // "was" identical to "now", which reads as a real (and flat) comparison.
        const hasDelta = a.delta !== undefined;
        const flat = hasDelta && Math.abs(a.delta as number) < 0.05;
        const d = (a.delta ?? 0) as number;
        const color = !hasDelta || flat ? "text-text-muted" : d > 0 ? "text-accent" : "text-danger";
        const sign = d > 0 ? "+" : d < 0 ? "−" : "";
        return (
          <div key={a.label} className="notch border border-border bg-surface p-5">
            <p className="hud-label">{a.label}</p>
            {hasDelta ? (
              <>
                <div className="mt-2.5 flex items-baseline gap-2.5">
                  <span className={`font-mono text-[30px] font-bold leading-none ${color}`}>
                    {flat ? "—" : `${sign}${a.format(Math.abs(d))}`}
                  </span>
                  <span className="font-mono text-xs text-text-muted">vs prev</span>
                </div>
                <p className="mt-2 font-mono text-[12.5px] text-text-body">
                  now {a.format(a.current)} · was {a.format(a.current - d)}
                </p>
              </>
            ) : (
              <>
                <div className="mt-2.5 flex items-baseline gap-2.5">
                  <span className="font-mono text-[30px] font-bold leading-none text-text">
                    {a.format(a.current)}
                  </span>
                </div>
                <p className="mt-2 font-mono text-[12.5px] text-text-muted">
                  no previous period yet
                </p>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
