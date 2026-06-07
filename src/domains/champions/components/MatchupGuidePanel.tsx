"use client";

import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMatchupGuide } from "@/hooks/useMatchupGuide";
import type { MatchupCell } from "@/domains/analysis/services/matchupService";

interface Props {
  cell: MatchupCell | null;
  onClose: () => void;
}

export function MatchupGuidePanel({ cell, onClose }: Props) {
  const { data, isLoading, isError } = useMatchupGuide(cell);

  if (!cell) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-surface shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
              Matchup Rehberi
            </p>
            <h2 className="mt-1 font-display text-lg font-bold text-text">
              {cell.playerChampion}
              <span className="mx-2 text-text-muted">vs</span>
              {cell.opponentChampion}
            </h2>
            <p className="mt-0.5 text-xs text-text-muted">
              {cell.wins}G / {cell.losses}M · KDA {cell.avgKda} · {cell.winRate}% WR
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-text-muted transition-colors hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-8 text-text-muted">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-sm">AI rehber oluşturuluyor…</p>
            </div>
          )}

          {isError && (
            <p className="text-sm text-danger">Rehber yüklenemedi. Tekrar dene.</p>
          )}

          {data && (
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                AI Coach Tavsiyesi
              </p>
              <div className="rounded-lg border border-border bg-surface-2 p-4 text-sm leading-relaxed text-text">
                {data.guide.split("\n").filter(Boolean).map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0">
                    {line}
                  </p>
                ))}
              </div>
              {data.cacheHit && (
                <p className="text-[10px] text-text-muted">Önbelleğe alınmış rehber</p>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border p-4">
          <Button variant="secondary" className="w-full" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </aside>
    </>
  );
}
