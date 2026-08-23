"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ItemIcon } from "@/components/ui/ItemIcon";
import { useBuildExplanation } from "@/hooks/useBuildExplanation";
import type { ItemExplanation } from "../types/buildExplanation.types";

interface BuildExplanationPanelProps {
  matchId: string;
  puuid: string;
  isPro: boolean;
  itemIds?: number[];
}

function ItemRow({ item, itemId }: { item: ItemExplanation; itemId: number }) {
  const good = item.wasGoodChoice;
  return (
    <div
      className={`rounded-lg border p-3 ${good ? "border-border bg-surface" : "border-danger/20 bg-danger/5"}`}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <ItemIcon itemId={itemId} size={52} />
          <span
            className={`absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${good ? "bg-success text-background" : "bg-danger text-background"}`}
          >
            {good ? "✓" : "✗"}
          </span>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <span className="text-sm font-semibold text-text">{item.itemName}</span>
          <p className="text-xs leading-relaxed text-text-muted">{item.reasoning}</p>
          {item.betterAlternative && (
            <p className="text-xs font-medium text-warning">
              → Alternatif: {item.betterAlternative}
            </p>
          )}
          <p className="text-xs italic text-text-muted/60">{item.whenToChoose}</p>
        </div>
      </div>
    </div>
  );
}

export function BuildExplanationPanel({
  matchId,
  puuid,
  isPro,
  itemIds = [],
}: BuildExplanationPanelProps) {
  const nonZeroItemIds = itemIds.filter((id) => id > 0);
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
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="text-sm font-medium text-text">Analyze This Build with AI</span>
        <div className="flex items-center gap-2">
          {!isPro && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs text-accent">
              PRO
            </span>
          )}
          {open ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </button>

      {open && (
        <div className="space-y-4 border-t border-border p-4">
          {!isPro && (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-surface-2 py-8 text-center">
              <Lock className="h-6 w-6 text-text-muted" />
              <p className="text-sm text-text-muted">Build analysis is a Pro feature.</p>
              <Button size="sm" asChild>
                <a href="/pricing">Upgrade →</a>
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
                  <ItemRow key={i} item={item} itemId={nonZeroItemIds[i] ?? 0} />
                ))}
              </div>
              <p className="text-sm italic text-text-muted">{data.buildPath}</p>
              {data.biggestMistake && (
                <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3">
                  <p className="text-xs font-semibold text-danger">Biggest Mistake</p>
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
