"use client";

import { BarChart2, TrendingUp, Swords } from "lucide-react";

interface Props {
  onSessionReview: () => void;
  onClimbRoadmap: () => void;
  onAramReview?: () => void;
  hasAramMatches?: boolean;
  isPending: boolean;
  isDisabled: boolean;
}

export function CoachingActionsCard({ onSessionReview, onClimbRoadmap, onAramReview, hasAramMatches, isPending, isDisabled }: Props) {
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

      {hasAramMatches && onAramReview && (
        <button
          onClick={onAramReview}
          disabled={isPending || isDisabled}
          className="group relative flex items-center gap-4 overflow-hidden rounded-xl border-2 border-blue-500/30 bg-blue-500/5 p-5 text-left transition-all duration-200 hover:border-blue-500/60 hover:bg-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 transition-colors group-hover:bg-blue-500/25">
            <Swords className="h-6 w-6" />
          </div>
          <div className="relative">
            <p className="text-base font-bold text-text">
              {isPending ? "Oluşturuluyor…" : "ARAM Analizi"}
            </p>
            <p className="mt-0.5 text-sm text-text-muted">Son ARAM maçların için takım dövüşü odaklı koçluk</p>
          </div>
          <span className="ml-auto shrink-0 rounded-full border border-blue-500/30 px-2 py-0.5 text-[11px] font-semibold text-blue-400">ARAM</span>
        </button>
      )}
    </div>
  );
}
