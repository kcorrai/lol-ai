"use client";

import { useImprovementPlan, useGeneratePlan } from "@/hooks/useImprovementPlan";
import type { PlanProgress } from "@/domains/analysis/types/analysis.types";

interface ImprovementPlanWidgetProps {
  riotAccountId: string | null | undefined;
}

function ProgressBar({ target }: { target: PlanProgress }) {
  const pct = Math.round(target.progress * 100);
  const barColor = target.achieved
    ? "bg-success"
    : target.progress >= 0.5
    ? "bg-warning"
    : "bg-border";

  const statusLabel = target.achieved
    ? "✅ Achieved"
    : target.progress >= 0.5
    ? "↑ On track"
    : "→ Needs work";

  const statusColor = target.achieved
    ? "text-success"
    : target.progress >= 0.5
    ? "text-warning"
    : "text-text-muted";

  const currentStr = target.unit
    ? `${target.current}${target.unit}`
    : String(target.current);
  const goalStr = target.unit
    ? `${target.goal}${target.unit}`
    : String(target.goal);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text">{target.label}</span>
        <span className={`font-medium ${statusColor}`}>{statusLabel}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-text-muted">
        <span>
          Current: <span className="font-medium text-text">{currentStr}</span>
        </span>
        <span>
          Goal: <span className="font-medium text-text">{goalStr}</span>
        </span>
      </div>
    </div>
  );
}

export function ImprovementPlanWidget({ riotAccountId }: ImprovementPlanWidgetProps) {
  const { data: plan, isLoading } = useImprovementPlan(riotAccountId);
  const generate = useGeneratePlan(riotAccountId);

  if (isLoading) {
    return <div className="h-32 animate-pulse rounded-xl border border-border bg-surface" />;
  }

  // No plan yet
  if (!plan) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-5 text-center">
        <p className="mb-1 text-sm font-semibold text-text">Start Your Improvement Plan</p>
        <p className="mb-4 text-xs text-text-muted">
          A personalised 2-week plan based on your current performance — with daily progress tracking.
        </p>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {generate.isPending ? "Generating…" : "Generate My Plan"}
        </button>
      </div>
    );
  }

  // Expired plan
  if (plan.status === "expired") {
    return (
      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Improvement Plan
          </p>
          <span className="rounded-full bg-border px-2 py-0.5 text-xs text-text-muted">
            Expired
          </span>
        </div>
        <div className="mb-4 space-y-3">
          {plan.targets.map((t) => (
            <ProgressBar key={t.metric} target={t} />
          ))}
        </div>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="w-full rounded-lg border border-accent px-4 py-2 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
        >
          {generate.isPending ? "Generating…" : "Start New Plan"}
        </button>
      </div>
    );
  }

  // Active plan (including all-achieved state)
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Your Plan
        </p>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span>{plan.weekLabel}</span>
          <span>·</span>
          <span>{plan.daysLeft}d left</span>
        </div>
      </div>

      {plan.allAchieved && (
        <div className="mb-3 rounded-lg bg-success/10 px-3 py-2 text-xs font-medium text-success">
          🎉 All goals achieved — generate a new plan to keep improving.
        </div>
      )}

      <div className="mb-4 space-y-4">
        {plan.targets.map((t) => (
          <ProgressBar key={t.metric} target={t} />
        ))}
      </div>

      {plan.allAchieved && (
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {generate.isPending ? "Generating…" : "Generate New Plan"}
        </button>
      )}
    </div>
  );
}
