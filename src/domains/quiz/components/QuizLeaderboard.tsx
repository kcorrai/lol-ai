"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuizLeaderboard } from "@/hooks/useQuizLeaderboard";
import type { LeaderboardPeriod } from "@/domains/quiz/services/quizLeaderboardService";
import { StageHeader, StageShell } from "./StageShell";

const PERIODS: { key: LeaderboardPeriod; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "This week" },
];

const GRID = "grid grid-cols-[36px_minmax(0,1fr)_72px_78px] items-center gap-3 px-3";

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
      className={`${GRID} border-b border-l-2 border-line-1 py-2.5 last:border-b-0 ${
        highlight ? "border-l-accent bg-accent/10" : "border-l-transparent"
      }`}
    >
      <span
        className={`font-mono text-[12.5px] tabular-nums ${rank <= 3 ? "text-accent" : "text-fg-4"}`}
      >
        {rank}
      </span>
      <span className="min-w-0 truncate text-[13.5px] text-fg-1">
        {slug ? (
          <Link href={`/u/${slug}`} className="hover:text-accent">
            {name}
          </Link>
        ) : (
          name
        )}
      </span>
      <span className="text-right font-mono text-[13px] tabular-nums text-fg-1">{modesSolved}</span>
      <span className="text-right font-mono text-[13px] tabular-nums text-fg-3">
        {totalGuesses}
      </span>
    </div>
  );
}

export function QuizLeaderboard(): React.JSX.Element {
  const [period, setPeriod] = useState<LeaderboardPeriod>("today");
  const { data, isLoading, isError } = useQuizLeaderboard(period);

  return (
    <StageShell>
      <StageHeader
        icon={Trophy}
        label="Leaderboard"
        note={data?.viewer ? `You · ${data.viewer.rank}${ordinal(data.viewer.rank)}` : "Live"}
      />

      <div className="grid animate-quiz-stage gap-3.5 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[56ch] text-[13px] leading-relaxed text-fg-2">
            Ranked on how well you played, not how long you have been playing: most modes solved
            first, then fewest guesses. A first-day player can top it.
          </p>
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={period === p.key}
                onClick={() => setPeriod(p.key)}
                className={`tag-cut border px-3 py-1 font-mono text-[10.5px] uppercase tracking-label ${
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

        {isLoading && <Skeleton className="h-56 w-full" />}

        {isError && (
          <p className="text-[13px] text-fg-2">The leaderboard could not be loaded right now.</p>
        )}

        {data && (
          <>
            <div className="border border-line-1 bg-surface-dark">
              <div
                className={`${GRID} border-b border-line-2 bg-surface-2 py-2 font-mono text-[9.5px] uppercase tracking-label text-text-muted`}
              >
                <span>#</span>
                <span>Player</span>
                <span className="text-right">Solved</span>
                <span className="text-right">Guesses</span>
              </div>

              {data.entries.length === 0 ? (
                <p className="px-3 py-8 text-center text-[13px] text-fg-3">
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
              <div className="bg-accent/8 border border-accent/30">
                <Row
                  rank={data.viewer.rank}
                  name={`${data.viewer.displayName} (you)`}
                  slug={null}
                  modesSolved={data.viewer.modesSolved}
                  totalGuesses={data.viewer.totalGuesses}
                  highlight
                />
                <p className="px-3 pb-2 pt-1 font-mono text-[10px] text-fg-4">
                  Your profile is private, so only you can see this line. Make it public in settings
                  to appear on the board.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </StageShell>
  );
}

/** 1st, 2nd, 3rd, 4th — English rules, including the teens that break them. */
function ordinal(rank: number): string {
  const tens = rank % 100;
  if (tens >= 11 && tens <= 13) return "th";
  return ["th", "st", "nd", "rd"][rank % 10] ?? "th";
}
