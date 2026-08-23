"use client";

import { useTiltStatus } from "@/hooks/useTiltStatus";
import { useWarmupStatus } from "@/hooks/useWarmupStatus";
import { computeReadinessScore } from "@/domains/analysis/services/sessionReadinessService";
import type { ReadinessLevel } from "@/domains/analysis/services/sessionReadinessService";

const LEVEL_CONFIG: Record<
  ReadinessLevel,
  { label: string; color: string; bar: string; icon: string }
> = {
  ready: {
    label: "Ready to Queue",
    color: "text-success",
    bar: "bg-success",
    icon: "🟢",
  },
  caution: {
    label: "Proceed with Caution",
    color: "text-warning",
    bar: "bg-warning",
    icon: "🟡",
  },
  not_ready: {
    label: "Not Recommended",
    color: "text-danger",
    bar: "bg-danger",
    icon: "🔴",
  },
};

interface SessionReadinessWidgetProps {
  riotAccountId: string | null | undefined;
}

export function SessionReadinessWidget({ riotAccountId }: SessionReadinessWidgetProps) {
  const { data: tilt, isLoading: tiltLoading } = useTiltStatus(riotAccountId);
  const { data: warmup, isLoading: warmupLoading } = useWarmupStatus(riotAccountId);

  if (tiltLoading || warmupLoading) {
    return <div className="h-28 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  if (!tilt || !warmup) return null;

  const result = computeReadinessScore(tilt, warmup);
  const cfg = LEVEL_CONFIG[result.level];

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Session Readiness
        </p>
        <span className={`text-sm font-semibold ${cfg.color}`}>
          {cfg.icon} {cfg.label}
        </span>
      </div>

      {/* Score + bar */}
      <div className="mb-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-text">{result.score}</span>
        <span className="text-xs text-text-muted">/ 100</span>
      </div>
      <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all ${cfg.bar}`}
          style={{ width: `${result.score}%` }}
        />
      </div>

      {/* Factor pills */}
      <div className="mb-3 flex flex-wrap gap-2">
        {result.factors.map((f) => (
          <span
            key={f.label}
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              f.positive
                ? "bg-success/10 text-success"
                : f.neutral
                  ? "bg-border text-text-muted"
                  : "bg-danger/10 text-danger"
            }`}
          >
            {f.positive ? "✓" : f.neutral ? "–" : "✗"} {f.label}
          </span>
        ))}
      </div>

      <p className="text-xs text-text-muted">{result.advice}</p>
    </div>
  );
}
