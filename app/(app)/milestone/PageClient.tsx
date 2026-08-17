"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Flame, Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useMilestone } from "@/hooks/useMilestone";
import { MilestoneHero } from "./MilestoneHero";
import { MilestoneNumbers } from "./MilestoneNumbers";
import { MilestoneRankJourney } from "./MilestoneRankJourney";
import { MilestoneChampionList } from "./MilestoneChampionList";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function LoadingSkeleton(): React.JSX.Element {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-56 w-full" />
    </div>
  );
}

export default function MilestonePage(): React.JSX.Element {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  function prev(): void {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  }

  function next(): void {
    const isCurrentOrFuture =
      year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (isCurrentOrFuture) return;
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  }

  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const { data, isLoading } = useMilestone(year, month);

  // The month before, for the deltas. Same endpoint the page already calls, so
  // no new data reaches the client that it could not ask for already.
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const { data: previous } = useMilestone(prevYear, prevMonth);

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b border-line-1 bg-surface/70 px-5 backdrop-blur md:px-8">
        <Link
          href="/dashboard"
          className="font-mono text-[10.5px] uppercase tracking-label text-fg-3 hover:text-fg-1"
        >
          ← Dashboard
        </Link>
        <span className="h-4 w-px bg-line-2" />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-fg-1">
          Monthly milestone
        </span>

        <span className="ml-auto flex items-center gap-2">
          <button
            onClick={prev}
            aria-label="Previous month"
            className="notch-sm border border-line-2 p-1.5 text-fg-3 transition-colors hover:border-acid-500 hover:text-acid-500"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <span className="notch-sm min-w-[140px] border border-line-2 px-3 py-1.5 text-center font-mono text-[10.5px] uppercase tracking-label text-fg-1">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button
            onClick={next}
            disabled={isCurrent}
            aria-label="Next month"
            className="notch-sm border border-line-2 p-1.5 text-fg-3 transition-colors hover:border-acid-500 hover:text-acid-500 disabled:opacity-30"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </span>
      </header>

      {data && <MilestoneHero data={data} isCurrent={isCurrent} />}

      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-5 md:px-8">
        {isLoading ? (
          <LoadingSkeleton />
        ) : !data ? (
          <section className="notch border border-dashed border-line-2 bg-surface/50 py-16 text-center">
            <Trophy className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
            <p className="text-sm font-medium text-text">No data for this month</p>
            <p className="mt-1 text-xs text-text-muted">
              No ranked solo matches found for {MONTH_NAMES[month - 1]} {year}.
            </p>
          </section>
        ) : (
          <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_306px]">
            <div className="grid min-w-0 gap-4">
              <MilestoneNumbers
                data={data}
                previous={previous}
                previousLabel={MONTH_NAMES[prevMonth - 1]}
              />
              <MilestoneRankJourney
                rankStart={data.rankStart}
                rankEnd={data.rankEnd}
                lpChange={data.lpChange}
              />
              <MilestoneChampionList champions={data.topChampions} />
            </div>

            <div className="grid gap-3.5 lg:sticky lg:top-4">
              {data.bestWinStreak >= 3 && (
                <section className="notch bg-hero-fade glow-accent-soft border border-acid-500 bg-surface px-4 py-4">
                  <div className="mb-2.5 flex items-center gap-2.5 text-acid-500">
                    <Flame className="h-4 w-4" aria-hidden />
                    <span className="font-mono text-[10px] uppercase tracking-label">
                      {"// BEST OF THE MONTH"}
                    </span>
                  </div>
                  <div className="font-display text-2xl font-black uppercase leading-none tracking-wide text-fg-1">
                    {data.bestWinStreak} win streak
                  </div>
                  <p className="mt-2.5 text-[13px] text-fg-2">
                    Your longest run this month, with a best game of {data.bestKda.toFixed(2)} KDA.
                  </p>
                </section>
              )}

              <section className="notch border border-border bg-surface px-4 pb-6 pt-4">
                <div className="font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-fg-1">
                  Next month&apos;s focus
                </div>
                <p className="mb-3 mt-2 text-[12.5px] text-fg-2">
                  Turn this month&apos;s reading into three tracked targets.
                </p>
                <Link
                  href="/improvement"
                  className="notch-sm inline-flex w-full items-center justify-center gap-2 border border-line-2 px-3 py-2 font-mono text-[10px] uppercase tracking-label text-fg-2 transition-colors hover:border-acid-500 hover:text-acid-500"
                >
                  Build the plan →
                </Link>
              </section>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
