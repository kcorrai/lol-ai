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
        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border-2 border-accent/50 bg-accent/8 p-5 text-left transition-all duration-200 hover:border-accent hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-50"
        style={{ boxShadow: "0 0 0 0 rgba(200,155,60,0)" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(200,155,60,0.15)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 0 0 rgba(200,155,60,0)"; }}
      >
        <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-accent/8 blur-2xl" />
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/25 text-accent transition-colors group-hover:bg-accent/40">
          <BarChart2 className="h-6 w-6" />
        </div>
        <div className="relative">
          <p className="text-base font-bold text-text">
            {isPending ? "Oluşturuluyor…" : "Seans Değerlendirmesi"}
          </p>
          <p className="mt-0.5 text-sm text-text-muted">Son 5 maçını AI ile analiz et</p>
        </div>
      </button>

      <button
        onClick={onClimbRoadmap}
        disabled={isPending || isDisabled}
        className="group relative flex items-center gap-4 overflow-hidden rounded-xl border-2 border-border bg-surface-2 p-5 text-left transition-all duration-200 hover:border-accent/40 hover:bg-surface-2/80 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <div className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-full bg-success/6 blur-2xl" />
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface text-text-muted transition-colors group-hover:bg-success/15 group-hover:text-success">
          <TrendingUp className="h-6 w-6" />
        </div>
        <div className="relative">
          <p className="text-base font-bold text-text">
            {isPending ? "Oluşturuluyor…" : "Çıkış Planı"}
          </p>
          <p className="mt-0.5 text-sm text-text-muted">Bir üst ranka giden yolu oluştur</p>
        </div>
      </button>
    </div>
  );
}
