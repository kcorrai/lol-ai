"use client";

import { useState } from "react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { cn } from "@/lib/utils";
import type { ChampionPoolEntry } from "@/domains/champions/services/championStatsService";
import { VERDICT_CHIP, VERDICT_LABEL, VERDICT_RULE, verdictFor, type PoolVerdict } from "./poolVerdict";

type SortKey = "winRate" | "gamesPlayed" | "masteryScore";

interface ChampionPoolTableProps {
  entries: ChampionPoolEntry[];
  isLoading: boolean;
  onDeepDive?: (championName: string) => void;
}

const COLS =
  "grid grid-cols-[minmax(0,1.4fr)_74px_118px_108px_66px_76px_84px] items-center gap-3.5 px-5";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "winRate", label: "Win rate" },
  { key: "gamesPlayed", label: "Games" },
  { key: "masteryScore", label: "Mastery" },
];

const FILTERS: { key: PoolVerdict | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "keep", label: "Keep" },
  { key: "watch", label: "Watch" },
  { key: "drop", label: "Drop" },
];

/**
 * One table, uniform rows.
 *
 * The pool was a wall of cards you had to read twice to compare two champions.
 * Rows put win rate under win rate, so the pool can be read down a column and
 * the verdict chips line up beside the numbers that produced them.
 */
export function ChampionPoolTable({
  entries,
  isLoading,
  onDeepDive,
}: ChampionPoolTableProps): React.JSX.Element {
  const [sort, setSort] = useState<SortKey>("winRate");
  const [filter, setFilter] = useState<PoolVerdict | "all">("all");

  const rows = entries
    .filter((entry) => filter === "all" || verdictFor(entry) === filter)
    .sort((a, b) => b[sort] - a[sort]);

  return (
    <div className="grid min-w-0 gap-4">
      <section className="notch flex flex-wrap items-center gap-3.5 border border-border bg-surface px-4 py-3">
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "tag-cut border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide transition-colors",
                filter === f.key
                  ? "border-acid-500 bg-acid-500/10 text-acid-500"
                  : "border-line-2 text-fg-3 hover:text-fg-1"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <span className="h-5 w-px bg-line-1" />
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-label text-text-muted">Sort</span>
          {SORTS.map((s) => (
            <button
              key={s.key}
              onClick={() => setSort(s.key)}
              className={cn(
                "tag-cut border px-2 py-1 font-mono text-[9.5px] uppercase tracking-wide transition-colors",
                sort === s.key
                  ? "border-acid-500 text-acid-500"
                  : "border-line-2 text-fg-3 hover:text-fg-1"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-wide text-fg-3">
          {rows.length} of {entries.length} · {VERDICT_RULE}
        </span>
      </section>

      <section className="notch min-w-0 overflow-x-auto border border-border bg-surface">
        <div className="min-w-[760px]">
          <div
            className={cn(
              COLS,
              "border-b border-line-2 bg-surface-2 py-3 font-mono text-[9.5px] uppercase tracking-label text-text-muted"
            )}
          >
            <span>Champion</span>
            <span className="text-right">Games</span>
            <span className="text-right">Win rate</span>
            <span className="text-center">Mastery</span>
            <span className="text-right">KDA</span>
            <span className="text-right">CS/min</span>
            <span className="text-right">Verdict</span>
          </div>

          {isLoading ? (
            <div className="h-40 animate-pulse bg-surface-2" />
          ) : rows.length === 0 ? (
            <p className="px-5 py-8 text-center text-sm text-text-muted">
              No champion matches this filter.
            </p>
          ) : (
            rows.map((entry) => {
              const verdict = verdictFor(entry);
              const wrClass =
                entry.winRate >= 60
                  ? "text-acid-500"
                  : entry.winRate < 45
                    ? "text-danger"
                    : "text-fg-1";
              return (
                <button
                  key={entry.championId}
                  onClick={() => onDeepDive?.(entry.championName)}
                  className={cn(
                    COLS,
                    "w-full border-b border-l-2 border-line-1 py-2.5 text-left transition-colors hover:bg-surface-2",
                    verdict === "keep"
                      ? "border-l-acid-500"
                      : verdict === "drop"
                        ? "border-l-danger/50"
                        : "border-l-transparent"
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <ChampionIcon name={entry.championName} size={34} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] text-fg-1">
                        {entry.championName}
                      </span>
                      <span className="block font-mono text-[9.5px] uppercase tracking-wide text-fg-4">
                        {entry.wins}W {entry.gamesPlayed - entry.wins}L
                      </span>
                    </span>
                  </span>

                  <span className="text-right font-mono text-[12.5px] tabular-nums text-fg-2">
                    {entry.gamesPlayed}
                  </span>

                  <span className="flex items-center justify-end gap-2.5">
                    <span className="h-1 w-[46px] bg-surface-dark">
                      <span
                        className={cn(
                          "block h-1",
                          entry.winRate >= 60
                            ? "bg-acid-500"
                            : entry.winRate < 45
                              ? "bg-danger"
                              : "bg-ink-400"
                        )}
                        style={{ width: `${entry.winRate}%` }}
                      />
                    </span>
                    <span
                      className={cn(
                        "w-[46px] text-right font-mono text-[13.5px] font-bold tabular-nums",
                        wrClass
                      )}
                    >
                      {entry.winRate}%
                    </span>
                  </span>

                  <span className="flex items-center justify-center gap-2.5">
                    <span className="h-1 w-[52px] bg-surface-dark">
                      <span
                        className="block h-1 bg-info"
                        style={{ width: `${entry.masteryScore}%` }}
                      />
                    </span>
                    <span className="w-6 text-right font-mono text-xs text-fg-3">
                      {entry.masteryScore}
                    </span>
                  </span>

                  <span className="text-right font-mono text-[12.5px] tabular-nums text-fg-2">
                    {entry.avgKda.toFixed(1)}
                  </span>
                  <span className="text-right font-mono text-[12.5px] tabular-nums text-fg-3">
                    {entry.avgCsPerMinute.toFixed(1)}
                  </span>
                  <span
                    className={cn(
                      "tag-cut justify-self-end border px-2 py-1 text-center font-mono text-[9.5px] font-bold uppercase tracking-label",
                      VERDICT_CHIP[verdict]
                    )}
                  >
                    {VERDICT_LABEL[verdict]}
                  </span>
                </button>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
