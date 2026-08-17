"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { cn } from "@/lib/utils";
import type { ChampionMonth } from "@/domains/analysis/services/milestoneService";

interface MilestoneChampionListProps {
  champions: ChampionMonth[];
}

const COLS =
  "grid grid-cols-[34px_minmax(0,1.5fr)_84px_118px_66px] items-center gap-3.5 px-5";

export function MilestoneChampionList({
  champions,
}: MilestoneChampionListProps): React.JSX.Element | null {
  if (champions.length === 0) return null;

  return (
    <section className="notch overflow-x-auto border border-border bg-surface">
      <div className="min-w-[560px]">
        <div className="flex items-center justify-between gap-3 border-b border-line-1 px-5 py-3">
          <span className="font-mono text-[10.5px] uppercase tracking-label text-text-muted">
            {"// THIS MONTH'S CHAMPIONS"}
          </span>
          <Link
            href="/champion-pool"
            className="font-mono text-[10px] uppercase tracking-wide text-acid-500 hover:text-acid-400"
          >
            Full pool →
          </Link>
        </div>

        <div
          className={cn(
            COLS,
            "border-b border-line-2 bg-surface-dark py-2.5 font-mono text-[9.5px] uppercase tracking-label text-text-muted"
          )}
        >
          <span>#</span>
          <span>Champion</span>
          <span className="text-right">Matches</span>
          <span className="text-right">Win rate</span>
          <span className="text-right">KDA</span>
        </div>

        {champions.map((champion, index) => {
          const strong = champion.winRate >= 60;
          const weak = champion.winRate < 50;
          return (
            <div
              key={champion.name}
              className={cn(
                COLS,
                "border-b border-l-2 border-line-1 py-2.5 last:border-b-0",
                strong ? "border-l-acid-500" : weak ? "border-l-danger/50" : "border-l-transparent"
              )}
            >
              <span className="font-mono text-xs text-fg-4">{index + 1}</span>
              <span className="flex min-w-0 items-center gap-3">
                <ChampionIcon name={champion.name} size={32} />
                <span className="min-w-0">
                  <span className="block truncate text-[13.5px] text-fg-1">{champion.name}</span>
                  <span className="block font-mono text-[9.5px] uppercase tracking-wide text-fg-4">
                    {champion.wins}W {champion.games - champion.wins}L
                  </span>
                </span>
              </span>
              <span className="text-right font-mono text-[12.5px] tabular-nums text-fg-2">
                {champion.games}
              </span>
              <span className="flex items-center justify-end gap-2.5">
                <span className="h-1 w-11 bg-surface-dark">
                  <span
                    className={cn(
                      "block h-1",
                      strong ? "bg-acid-500" : weak ? "bg-danger" : "bg-ink-400"
                    )}
                    style={{ width: `${Math.max(3, champion.winRate)}%` }}
                  />
                </span>
                <span
                  className={cn(
                    "w-[42px] text-right font-mono text-[13px] font-bold tabular-nums",
                    strong ? "text-acid-500" : weak ? "text-danger" : "text-fg-1"
                  )}
                >
                  {champion.winRate}%
                </span>
              </span>
              <span className="text-right font-mono text-[12.5px] tabular-nums text-fg-2">
                {champion.avgKda.toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
