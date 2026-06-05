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
        className="group flex items-center gap-4 rounded-xl border-2 border-accent/50 bg-accent/8 p-5 text-left transition-colors hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/25 text-accent transition-colors group-hover:bg-accent/40">
          <BarChart2 className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-bold text-text">
            {isPending ? "Generating…" : "Session Review"}
          </p>
          <p className="mt-0.5 text-sm text-text-muted">Son 5 maçını AI ile analiz et</p>
        </div>
      </button>

      <button
        onClick={onClimbRoadmap}
        disabled={isPending || isDisabled}
        className="group flex items-center gap-4 rounded-xl border-2 border-border bg-surface-2 p-5 text-left transition-colors hover:border-accent/50 hover:bg-surface-2/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-text-muted transition-colors group-hover:text-accent">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div>
          <p className="text-base font-bold text-text">
            {isPending ? "Generating…" : "Climb Roadmap"}
          </p>
          <p className="mt-0.5 text-sm text-text-muted">Bir üst ranka giden yolu oluştur</p>
        </div>
      </button>
    </div>
  );
}
