"use client";

import { useState } from "react";
import Link from "next/link";
import { HudPanel } from "@/components/dashboard/laneiq/HudPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuizLeaderboard } from "@/hooks/useQuizLeaderboard";
import type { LeaderboardPeriod } from "@/domains/quiz/services/quizLeaderboardService";

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
];

function Row({
  rank,
  name,
  slug,
  modesSolved,
  totalGuesses,
  highlight,
}: {
  rank: number;
  name: string;
  slug: string | null;
  modesSolved: number;
  totalGuesses: number;
  highlight?: boolean;
}): React.JSX.Element {
  return (
    <div
      className={`flex items-center gap-3 border-b border-line-1 px-3 py-2 last:border-b-0 ${
        highlight ? "bg-accent/10" : ""
      }`}
    >
      <span
        className={`w-8 shrink-0 font-mono text-[12px] tabular-nums ${
          rank <= 3 ? "text-accent" : "text-fg-4"
        }`}
      >
        {rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] text-fg-1">
        {slug ? (
          <Link href={`/u/${slug}`} className="hover:text-accent">
            {name}
          </Link>
        ) : (
          name
        )}
      </span>
      <span className="shrink-0 font-mono text-[11.5px] tabular-nums text-fg-2">
        {modesSolved}
      </span>
      <span className="w-12 shrink-0 text-right font-mono text-[11.5px] tabular-nums text-fg-3">
        {totalGuesses}
      </span>
    </div>
  );
}

export function QuizLeaderboard(): React.JSX.Element {
  const [period, setPeriod] = useState<LeaderboardPeriod>("today");
  const { data, isLoading, isError } = useQuizLeaderboard(period);

  return (
    <HudPanel className="space-y-3 p-4 md:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-fg-1">
          Leaderboard
        </h2>
        <div className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              aria-pressed={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={`notch-sm border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-label ${
                period === p.key
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-line-2 bg-surface-dark text-fg-3 hover:text-fg-1"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-[12.5px] leading-relaxed text-fg-3">
        Ranked on how well you played, not how long you have been playing: most modes solved
        first, then fewest guesses. A first-day player can top it.
      </p>

      {isLoading && <Skeleton className="h-52 w-full" />}

      {isError && (
        <p className="text-[13px] text-fg-2">The leaderboard could not be loaded right now.</p>
      )}

      {data && (
        <>
          <div className="notch-sm overflow-hidden border border-line-2 bg-surface-dark">
            <div className="flex items-center gap-3 border-b border-line-1 px-3 py-1.5">
              <span className="hud-label w-8 shrink-0">#</span>
              <span className="hud-label flex-1">Player</span>
              <span className="hud-label shrink-0">Solved</span>
              <span className="hud-label w-12 shrink-0 text-right">Guesses</span>
            </div>

            {data.entries.length === 0 ? (
              <p className="px-3 py-6 text-center text-[13px] text-fg-3">
                Nobody has solved a puzzle {period === "today" ? "today" : "this week"} yet. Be
                first.
              </p>
            ) : (
              data.entries.map((entry) => (
                <Row
                  key={entry.userId}
                  rank={entry.rank}
                  name={entry.displayName}
                  slug={entry.profileSlug}
                  modesSolved={entry.modesSolved}
                  totalGuesses={entry.totalGuesses}
                  highlight={entry.userId === data.viewer?.userId}
                />
              ))
            )}
          </div>

          {data.viewer && !data.viewer.listed && (
            <div className="notch-sm border border-accent/30 bg-accent/8">
              <Row
                rank={data.viewer.rank}
                name={`${data.viewer.displayName} (you)`}
                slug={null}
                modesSolved={data.viewer.modesSolved}
                totalGuesses={data.viewer.totalGuesses}
                highlight
              />
              <p className="px-3 pb-2 font-mono text-[10px] text-fg-4">
                Your profile is private, so only you can see this line. Make it public in settings
                to appear on the board.
              </p>
            </div>
          )}
        </>
      )}
    </HudPanel>
  );
}
