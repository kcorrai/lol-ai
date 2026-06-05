"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { cn } from "@/lib/utils";
import type { CounterEntry } from "../types/counter.types";

const TIER_STYLES: Record<CounterEntry["tier"], string> = {
  S: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  A: "bg-green-500/15 text-green-400 border-green-500/30",
  B: "bg-yellow-500/15 text-yellow-500 border-yellow-500/30",
};

const DIFFICULTY_STYLES: Record<CounterEntry["difficulty"], string> = {
  easy: "bg-green-500/15 text-green-400",
  medium: "bg-yellow-500/15 text-yellow-500",
  hard: "bg-red-500/15 text-red-400",
};

const DIFFICULTY_LABELS: Record<CounterEntry["difficulty"], string> = {
  easy: "Kolay",
  medium: "Orta",
  hard: "Zor",
};

interface CounterCardProps {
  entry: CounterEntry;
}

export function CounterCard({ entry }: CounterCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-surface-2"
      >
        <ChampionIcon name={entry.champion} size={40} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-text">{entry.champion}</p>
          <p className="truncate text-xs text-text-muted">{entry.reasonWhy}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            className={cn(
              "rounded border px-2 py-0.5 text-xs font-bold",
              TIER_STYLES[entry.tier]
            )}
          >
            {entry.tier}
          </span>
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs",
              DIFFICULTY_STYLES[entry.difficulty]
            )}
          >
            {DIFFICULTY_LABELS[entry.difficulty]}
          </span>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-text-muted" />
          ) : (
            <ChevronDown className="h-4 w-4 text-text-muted" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="space-y-2 border-t border-border px-3 pb-3 pt-3">
          <DetailRow label="Lane Avantajı" value={entry.laneAdvantage} />
          <DetailRow label="Dikkat Et" value={entry.watchOut} />
          <DetailRow label="Build İpucu" value={entry.buildHint} />
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-text-muted">{label}</p>
      <p className="text-sm text-text">{value}</p>
    </div>
  );
}
