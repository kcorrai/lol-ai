"use client";

import { motion } from "framer-motion";
import { PreviewBadge } from "@/domains/onboarding/preview/PreviewBadge";
import { cn } from "@/lib/utils";

// Sample past improvement plans shown during the guided first-journey. A brand-new user has no
// completed plans, so this illustrates how weekly plans accumulate and get scored (TASK-219).
// Deterministic sample data, clearly labelled (see PreviewBadge).

interface SamplePlan {
  range: string;
  completed: number;
  total: number;
  score: number;
  active?: boolean;
}

const SAMPLE_PLANS: SamplePlan[] = [
  { range: "12 Mar — 19 Mar", completed: 4, total: 5, score: 78, active: true },
  { range: "5 Mar — 12 Mar", completed: 3, total: 5, score: 61 },
  { range: "26 Feb — 5 Mar", completed: 1, total: 4, score: 29 },
];

function SamplePlanCard({ plan, index }: { plan: SamplePlan; index: number }): React.JSX.Element {
  const scoreColor = plan.score >= 66 ? "text-success" : plan.score >= 33 ? "text-warning" : "text-danger";
  const barColor = plan.score >= 66 ? "bg-success" : plan.score >= 33 ? "bg-warning" : "bg-danger/60";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.35, ease: "easeOut" }}
      className={cn("rounded-xl border bg-surface p-4", plan.active ? "border-accent/30" : "border-border")}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text">{plan.range}</p>
          <p className="mt-0.5 text-xs text-text-muted">{plan.completed}/{plan.total} targets completed</p>
        </div>
        <div className="flex items-center gap-2">
          {plan.active && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              Active
            </span>
          )}
          <span className={cn("text-xl font-bold tabular-nums", scoreColor)}>{plan.score}</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <motion.div
          className={cn("h-full rounded-full", barColor)}
          initial={{ width: 0 }}
          animate={{ width: `${plan.score}%` }}
          transition={{ delay: 0.3 + index * 0.12, duration: 0.5, ease: "easeOut" }}
        />
      </div>
    </motion.div>
  );
}

export function ImprovementHistoryPreview(): React.JSX.Element {
  return (
    <div data-tour="improvement-preview" className="space-y-4">
      <div className="flex items-center justify-end">
        <PreviewBadge />
      </div>
      {SAMPLE_PLANS.map((plan, i) => (
        <SamplePlanCard key={plan.range} plan={plan} index={i} />
      ))}
    </div>
  );
}
