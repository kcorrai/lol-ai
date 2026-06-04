"use client";

import { useTiltStatus } from "@/hooks/useTiltStatus";
import type { TiltLevel } from "@/domains/analysis/services/tiltService";

const LEVEL_CONFIG: Record<TiltLevel, { label: string; color: string; bar: string; icon: string }> = {
  focused: {
    label: "Focused",
    color: "text-success",
    bar: "bg-success",
    icon: "🟢",
  },
  caution: {
    label: "Caution",
    color: "text-warning",
    bar: "bg-warning",
    icon: "🟡",
  },
  tilting: {
    label: "Tilting",
    color: "text-danger",
    bar: "bg-danger",
    icon: "🔴",
  },
};

interface TiltWidgetProps {
  riotAccountId: string | null | undefined;
}

export function TiltWidget({ riotAccountId }: TiltWidgetProps) {
  const { data: tilt, isLoading } = useTiltStatus(riotAccountId);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-border bg-surface p-4 animate-pulse">
        <div className="h-4 w-24 rounded bg-border" />
        <div className="mt-3 h-2 w-full rounded bg-border" />
      </div>
    );
  }

  if (!tilt) return null;

  const cfg = LEVEL_CONFIG[tilt.level];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Mental State
        </p>
        <span className={`text-sm font-semibold ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Score bar */}
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all ${cfg.bar}`}
          style={{ width: `${tilt.score}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="mb-3 flex gap-4 text-xs text-text-muted">
        <span>
          Loss streak:{" "}
          <span className={tilt.lossStreak >= 3 ? "font-semibold text-danger" : "font-semibold text-text"}>
            {tilt.lossStreak}
          </span>
        </span>
        <span>
          Win rate:{" "}
          <span className="font-semibold text-text">
            {Math.round(tilt.recentWinRate * 100)}%
          </span>
        </span>
        <span>
          KDA trend:{" "}
          <span className={
            tilt.kdaTrend === "improving" ? "font-semibold text-success" :
            tilt.kdaTrend === "declining" ? "font-semibold text-danger" :
            "font-semibold text-text"
          }>
            {tilt.kdaTrend === "improving" ? "↑" : tilt.kdaTrend === "declining" ? "↓" : "→"}
          </span>
        </span>
      </div>

      <p className="text-xs text-text-muted">{tilt.message}</p>
    </div>
  );
}
