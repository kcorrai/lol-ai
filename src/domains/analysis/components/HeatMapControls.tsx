"use client";

import { cn } from "@/lib/utils";

const TIME_RANGES = [
  { value: undefined,  label: "All" },
  { value: "early",   label: "0-15min" },
  { value: "mid",     label: "15-30min" },
  { value: "late",    label: "30+min" },
];

const MATCH_COUNTS = [10, 20, 50];

interface Props {
  champions: string[];
  champion: string | undefined;
  timeRange: string | undefined;
  matchCount: number;
  onChampionChange: (c: string | undefined) => void;
  onTimeRangeChange: (t: string | undefined) => void;
  onMatchCountChange: (n: number) => void;
  isPro: boolean;
}

export function HeatMapControls({
  champions,
  champion,
  timeRange,
  matchCount,
  onChampionChange,
  onTimeRangeChange,
  onMatchCountChange,
  isPro,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm">
      {/* Champion filter */}
      {champions.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">Champion:</span>
          <select
            className="rounded-md border border-border bg-surface px-2 py-1 text-xs text-text focus:outline-none"
            value={champion ?? ""}
            onChange={(e) => onChampionChange(e.target.value || undefined)}
          >
            <option value="">All</option>
            {champions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      )}

      {/* Time range */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-text-muted">Duration:</span>
        {TIME_RANGES.map((t) => (
          <button
            key={t.label}
            onClick={() => onTimeRangeChange(t.value)}
            className={cn(
              "rounded px-2 py-1 text-xs transition-colors",
              timeRange === t.value
                ? "bg-accent text-background"
                : "text-text-muted hover:text-text"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Match count — Pro only for 50 */}
      <div className="flex items-center gap-1">
        <span className="mr-1 text-xs text-text-muted">Matches:</span>
        {MATCH_COUNTS.map((n) => {
          const disabled = n === 50 && !isPro;
          return (
            <button
              key={n}
              onClick={() => !disabled && onMatchCountChange(n)}
              disabled={disabled}
              className={cn(
                "rounded px-2 py-1 text-xs transition-colors",
                matchCount === n ? "bg-accent text-background" : "text-text-muted hover:text-text",
                disabled && "cursor-not-allowed opacity-40"
              )}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
