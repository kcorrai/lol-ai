"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { cn } from "@/lib/utils";
import { CounterCardDetails } from "./CounterCardDetails";
import type { CounterEntry } from "../types/counter.types";

const TIER_STYLES: Record<CounterEntry["tier"], string> = {
  S: "bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]",
  A: "bg-green-500/20 text-green-400 border-green-500/40",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/40",
  C: "bg-border/40 text-text-muted border-border",
};

const TIER_ACCENT: Record<CounterEntry["tier"], string> = {
  S: "border-l-purple-500",
  A: "border-l-green-500",
  B: "border-l-blue-500",
  C: "border-l-border",
};

const DIFFICULTY_STYLES: Record<CounterEntry["difficulty"], string> = {
  easy:   "text-green-400",
  medium: "text-yellow-400",
  hard:   "text-red-400",
};

const DIFFICULTY_LABELS: Record<CounterEntry["difficulty"], string> = {
  easy: "Kolay", medium: "Orta", hard: "Zor",
};

function computeScore(entry: CounterEntry): number {
  const base = { S: 92, A: 80, B: 68, C: 56 }[entry.tier] ?? 68;
  const bonus = entry.winRate != null ? Math.round((entry.winRate - 50) * 2) : 0;
  return Math.min(98, Math.max(50, base + bonus));
}

function computeConfidence(entry: CounterEntry): number {
  let conf = 70;
  if (entry.winRate != null) conf += 10;
  if (entry.skillOrder) conf += 7;
  if (entry.buildPath) conf += 6;
  if (entry.runeAdvice?.primaryRunes) conf += 5;
  return Math.min(98, conf);
}

export function CounterCard({ entry }: { entry: CounterEntry }) {
  const [expanded, setExpanded] = useState(false);
  const score = computeScore(entry);
  const confidence = computeConfidence(entry);

  return (
    <div className={cn(
      "overflow-hidden rounded-xl border-l-2 border border-border bg-surface",
      "transition-all duration-200 hover:border-accent/40 hover:shadow-[0_0_16px_rgba(var(--accent-rgb),0.08)]",
      TIER_ACCENT[entry.tier]
    )}>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 p-3.5 text-left"
      >
        <ChampionIcon name={entry.champion} size={44} className="rounded-lg shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-sm font-semibold text-text">{entry.champion}</p>
            <span className={cn("rounded border px-1.5 py-0.5 text-[11px] font-bold", TIER_STYLES[entry.tier])}>
              {entry.tier}
            </span>
          </div>
          <p className="truncate text-xs text-text-muted leading-snug">{entry.reasonWhy}</p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <div className="flex items-baseline gap-0.5">
            <span className="text-base font-bold text-accent tabular-nums">{score}</span>
            <span className="text-[10px] text-text-muted">/100</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {entry.winRate != null && (
              <span className="text-[11px] text-text-muted tabular-nums">{entry.winRate.toFixed(1)}%</span>
            )}
            <span className="text-[11px] text-text-muted/50">·</span>
            <span className="text-[11px] text-text-muted/60">{confidence}% güven</span>
            <span className={cn("text-[11px] font-medium ml-0.5", DIFFICULTY_STYLES[entry.difficulty])}>
              {DIFFICULTY_LABELS[entry.difficulty]}
            </span>
            {expanded
              ? <ChevronUp className="h-3.5 w-3.5 text-text-muted" />
              : <ChevronDown className="h-3.5 w-3.5 text-text-muted" />
            }
          </div>
        </div>
      </button>

      {expanded && <CounterCardDetails entry={entry} />}
    </div>
  );
}
