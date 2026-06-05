"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBuildExplanation } from "@/hooks/useBuildExplanation";
import type { ItemExplanation } from "../types/buildExplanation.types";

interface BuildExplanationPanelProps {
  matchId: string;
  puuid: string;
  isPro: boolean;
}

function ItemRow({ item }: { item: ItemExplanation }) {
  return (
    <div className="rounded-lg border border-border p-3 space-y-1">
      <div className="flex items-center gap-2">
        {item.wasGoodChoice ? (
          <Check className="h-4 w-4 shrink-0 text-green-400" />
        ) : (
          <X className="h-4 w-4 shrink-0 text-red-400" />
        )}
        <span className="text-sm font-medium text-text">{item.itemName}</span>
      </div>
      <p className="text-xs text-text-muted pl-6">{item.reasoning}</p>
      {item.betterAlternative && (
        <p className="text-xs text-yellow-400 pl-6">Alternatif: {item.betterAlternative}</p>
      )}
      <p className="text-xs text-text-muted/60 pl-6 italic">{item.whenToChoose}</p>
    </div>
  );
}

export function BuildExplanationPanel({ matchId, puuid, isPro }: BuildExplanationPanelProps) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, trigger } = useBuildExplanation(matchId, puuid);

  function handleOpen() {
    setOpen(true);
    if (isPro && !data) void trigger();
  }

  return (
    <div className="rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={open ? () => setOpen(false) : handleOpen}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-surface-2 transition-colors"
      >
        <span className="text-sm font-medium text-text">Bu Buildi AI ile Analiz Et</span>
        <div className="flex items-center gap-2">
          {!isPro && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent">
              PRO
            </span>
          )}
          {open ? <ChevronUp className="h-4 w-4 text-text-muted" /> : <ChevronDown className="h-4 w-4 text-text-muted" />}
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {!isPro && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface-2 py-8 text-center">
              <Lock className="h-6 w-6 text-text-muted" />
              <p className="text-sm text-text-muted">Build analizi Pro özelliğidir.</p>
              <Button size="sm" asChild>
                <a href="/pricing">Upgrade Yap →</a>
              </Button>
            </div>
          )}

          {isPro && isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-text-muted" />
            </div>
          )}

          {isPro && data && (
            <>
              <p className="text-sm text-text">{data.summary}</p>
              <div className="space-y-2">
                {data.items.map((item, i) => (
                  <ItemRow key={i} item={item} />
                ))}
              </div>
              <p className="text-sm italic text-text-muted">{data.buildPath}</p>
              {data.biggestMistake && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3">
                  <p className="text-xs font-semibold text-red-400">En Büyük Hata</p>
                  <p className="text-sm text-text-muted">{data.biggestMistake}</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
