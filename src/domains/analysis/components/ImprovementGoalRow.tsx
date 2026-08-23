"use client";

import type { PlanProgress } from "@/domains/analysis/types/analysis.types";

interface Props {
  goal: PlanProgress;
}

export function ImprovementGoalRow({ goal }: Props) {
  const pct = Math.round(goal.progress * 100);
  const directionLabel = goal.direction === "decrease" ? "↓" : "↑";

  const statusIcon = goal.achieved
    ? "✅"
    : goal.progress > 0.5
      ? "⏳"
      : goal.progress > 0
        ? "⏳"
        : "❌";

  const barColor = goal.achieved ? "bg-accent" : goal.progress > 0.5 ? "bg-info" : "bg-danger/70";

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-5 shrink-0 text-base">{statusIcon}</span>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm font-medium text-text">{goal.label}</span>
          <span className="ml-2 shrink-0 text-xs text-text-body">
            {goal.baseline}
            {goal.unit} {directionLabel} {goal.goal}
            {goal.unit}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-surface-dark">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <span className="w-16 shrink-0 text-right text-sm font-semibold text-text">
        {goal.current}
        {goal.unit}
      </span>
    </div>
  );
}
