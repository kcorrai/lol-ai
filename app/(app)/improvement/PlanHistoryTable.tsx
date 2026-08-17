"use client";

import { cn } from "@/lib/utils";
import type { PlanHistoryEntry } from "@/domains/analysis/services/improvementPlanService";
import { chipClass, formatWindow, toneFill, type PlanTone } from "./planView";

interface PlanHistoryTableProps {
  entries: PlanHistoryEntry[];
}

function scoreTone(score: number): PlanTone {
  if (score >= 66) return "good";
  if (score >= 33) return "warn";
  return "bad";
}

function HistoryRow({ entry }: { entry: PlanHistoryEntry }): React.JSX.Element {
  const tone = scoreTone(entry.weeklyScore);
  const active = entry.status === "active";

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-line-1 px-5 py-3 last:border-b-0 sm:grid-cols-[150px_84px_minmax(0,1fr)_76px]">
      <span className="font-mono text-[12.5px] text-fg-1">
        {formatWindow(entry.createdAt, entry.expiresAt)}
      </span>
      <span className={chipClass(active ? "good" : "flat")}>{active ? "Active" : "Ended"}</span>
      <span className="flex items-center gap-2.5">
        <span className="h-[5px] flex-1 bg-surface-dark">
          <span
            className={cn("block h-[5px]", toneFill(tone))}
            style={{ width: `${entry.weeklyScore}%` }}
          />
        </span>
        <span className="whitespace-nowrap font-mono text-[11.5px] text-fg-3">
          {entry.completedCount} of {entry.totalTargets}
        </span>
      </span>
      <span className="text-right font-mono text-[13px] tabular-nums text-fg-1">
        {entry.weeklyScore}
      </span>
    </div>
  );
}

export function PlanHistoryTable({ entries }: PlanHistoryTableProps): React.JSX.Element {
  return (
    <section className="notch border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
        <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
          {"// PLAN HISTORY"}
        </span>
        <span className="font-mono text-[10.5px] uppercase tracking-wide text-fg-4">
          Score out of 100
        </span>
      </div>
      {entries.map((entry) => (
        <HistoryRow key={entry.id} entry={entry} />
      ))}
    </section>
  );
}
