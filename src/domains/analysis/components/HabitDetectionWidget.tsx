"use client";

import { AlertTriangle, CheckCircle2, Brain } from "lucide-react";
import { useHabits } from "@/hooks/useHabits";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SEVERITY_STYLE: Record<string, string> = {
  high: "border-danger/30 bg-danger/5",
  medium: "border-warning/30 bg-warning/5",
  low: "border-border bg-surface-2",
};

const SEVERITY_ICON_COLOR: Record<string, string> = {
  high: "text-danger",
  medium: "text-warning",
  low: "text-text-muted",
};

const WEEK_LABEL: Record<number, string> = {
  2: "2 weeks",
  3: "3 weeks",
  4: "4+ weeks",
};

function weekText(n: number): string {
  return WEEK_LABEL[Math.min(n, 4)] ?? `${n} weeks`;
}

interface Props {
  riotAccountId: string | null | undefined;
}

export function HabitDetectionWidget({ riotAccountId }: Props) {
  const { data: habits, isLoading } = useHabits(riotAccountId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-14 w-full rounded-xl" />
        <Skeleton className="h-14 w-full rounded-xl" />
      </div>
    );
  }

  if (!habits || habits.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success/5 px-4 py-3">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
        <div>
          <p className="text-sm font-medium text-text">No detected habits</p>
          <p className="text-xs text-text-muted">
            Your gameplay looks consistent — play a lot this week!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {habits.map((habit) => (
        <div
          key={habit.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border px-4 py-3",
            SEVERITY_STYLE[habit.severity] ?? SEVERITY_STYLE.low
          )}
        >
          <AlertTriangle
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0",
              SEVERITY_ICON_COLOR[habit.severity] ?? "text-text-muted"
            )}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="text-sm font-semibold text-text">{habit.displayName}</p>
              <span className="rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-text-muted">
                {weekText(habit.weekCount)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-text-muted">{habit.message}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// Compact version for the dashboard sidebar
export function HabitDetectionCard({ riotAccountId }: Props) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-4 w-4 text-accent" />
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Habit Detection
        </p>
      </div>
      <HabitDetectionWidget riotAccountId={riotAccountId} />
    </div>
  );
}
