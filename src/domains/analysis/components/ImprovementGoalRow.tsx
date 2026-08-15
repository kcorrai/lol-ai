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

  const barColor = goal.achieved
    ? "bg-accent"
    : goal.progress > 0.5
    ? "bg-info"
    : "bg-danger/70";

  return (
    <div className="flex items-center gap-3 py-2">
      <span className="w-5 text-base shrink-0">{statusIcon}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium text-text">{goal.label}</span>
          <span className="text-xs text-text-body shrink-0 ml-2">
            {goal.baseline}
            {goal.unit} {directionLabel} {goal.goal}
            {goal.unit}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-surface-dark overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <span className="text-sm font-semibold text-text w-16 text-right shrink-0">
        {goal.current}
        {goal.unit}
      </span>
    </div>
  );
}
