"use client";

import { BarChart2, TrendingUp } from "lucide-react";

interface Props {
  onSessionReview: () => void;
  onClimbRoadmap: () => void;
  isPending: boolean;
  isDisabled: boolean;
}

export function CoachingActionsCard({ onSessionReview, onClimbRoadmap, isPending, isDisabled }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <button
        onClick={onSessionReview}
        disabled={isPending || isDisabled}
        className="group flex items-center gap-4 rounded-xl border border-accent/30 bg-accent/5 p-4 text-left transition-colors hover:border-accent/60 hover:bg-accent/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20 text-accent transition-colors group-hover:bg-accent/30">
          <BarChart2 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-text">
            {isPending ? "Generating…" : "Session Review"}
          </p>
          <p className="text-xs text-text-muted">Analyze your last 5 games with AI</p>
        </div>
      </button>

      <button
        onClick={onClimbRoadmap}
        disabled={isPending || isDisabled}
        className="group flex items-center gap-4 rounded-xl border border-border bg-surface-2 p-4 text-left transition-colors hover:border-accent/40 hover:bg-surface-2/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface text-text-muted transition-colors group-hover:text-accent">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold text-text">
            {isPending ? "Generating…" : "Climb Roadmap"}
          </p>
          <p className="text-xs text-text-muted">Build your path to the next rank</p>
        </div>
      </button>
    </div>
  );
}
