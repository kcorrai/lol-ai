"use client";

import { useRankUpProbability } from "@/hooks/useRankUpProbability";
import type { RankUpLevel } from "@/domains/analysis/types/analysis.types";

const LEVEL_CONFIG: Record<RankUpLevel, { label: string; color: string; bar: string }> = {
  high:     { label: "High Chance",   color: "text-success", bar: "bg-success" },
  moderate: { label: "Moderate",      color: "text-warning", bar: "bg-warning" },
  low:      { label: "Low Chance",    color: "text-danger",  bar: "bg-danger"  },
};

interface FactorRowProps {
  label: string;
  pts: number;
  max: number;
  detail: string;
}

function FactorRow({ label, pts, max, detail }: FactorRowProps) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-28 shrink-0 text-text-muted">{label}</span>
      <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-accent/60 transition-all"
          style={{ width: `${(pts / max) * 100}%` }}
        />
      </div>
      <span className="w-20 text-right font-medium text-text">{detail}</span>
    </div>
  );
}

interface RankUpWidgetProps {
  riotAccountId: string | null | undefined;
}

export function RankUpWidget({ riotAccountId }: RankUpWidgetProps) {
  const { data: result, isLoading } = useRankUpProbability(riotAccountId);

  if (isLoading) {
    return <div className="h-36 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  if (!result) return null;

  const cfg = LEVEL_CONFIG[result.level];
  const wrPct = Math.round(result.recentWinRate * 100);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Rank Up Probability
        </p>
        <span className={`text-sm font-semibold ${cfg.color}`}>{cfg.label}</span>
      </div>

      {/* Score + bar */}
      <div className="mb-1 flex items-baseline gap-2">
        <span className="text-3xl font-bold text-text">{result.score}</span>
        <span className="text-xs text-text-muted">/ 100</span>
        <span className="ml-auto text-xs text-text-muted">→ {result.nextLabel}</span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all ${cfg.bar}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Estimated games + message */}
      <p className="mb-4 text-xs text-text-muted">{result.message}</p>

      {/* Factor breakdown */}
      <div className="space-y-2">
        <FactorRow
          label="LP proximity"
          pts={result.components.lpProximity}
          max={30}
          detail={`${result.currentLP} LP`}
        />
        <FactorRow
          label="Recent form"
          pts={result.components.winRate}
          max={35}
          detail={`${wrPct}% WR`}
        />
        <FactorRow
          label="Trend"
          pts={result.components.trend}
          max={20}
          detail={result.trend}
        />
        <FactorRow
          label="Mental"
          pts={result.components.mental}
          max={15}
          detail={
            result.components.mental === 15 ? "focused" :
            result.components.mental >= 8  ? "caution" : "tilt risk"
          }
        />
      </div>
    </div>
  );
}
