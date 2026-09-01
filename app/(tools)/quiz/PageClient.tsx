"use client";

import { useCallback, useEffect, useState } from "react";
import { QUIZ_MODES, type ModeResult, type QuizMode } from "@/domains/quiz";
import { ModeStrip, TAB_ORDER, type QuizTab } from "@/domains/quiz/components/ModeStrip";
import { PersonalQuiz } from "@/domains/quiz/components/PersonalQuiz";
import { QuizBoard } from "@/domains/quiz/components/QuizBoard";
import { QuizHero } from "@/domains/quiz/components/QuizHero";
import { QuizLeaderboard } from "@/domains/quiz/components/QuizLeaderboard";
import { useQuizProgress } from "@/hooks/useQuizProgress";
import { formatDate } from "@/lib/uiLocale";

const RESULTS_KEY = "laneiq-quiz-day";

interface StoredDay {
  dateKey: string;
  results: ModeResult[];
}

function readDay(dateKey: string): ModeResult[] {
  try {
    const raw = window.localStorage.getItem(RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredDay;
    return parsed.dateKey === dateKey ? parsed.results : [];
  } catch {
    return [];
  }
}

export default function QuizPage(): React.JSX.Element {
  const [tab, setTab] = useState<QuizTab>("classic");
  const isPuzzle = tab !== "personal" && tab !== "board";
  const mode: QuizMode = isPuzzle ? tab : "classic";
  // Practice is off the clock and off the streak. A new seed is a new puzzle;
  // undefined means the daily one.
  const [practiceSeed, setPracticeSeed] = useState<string>();
  const [results, setResults] = useState<ModeResult[]>([]);
  const [dateKey, setDateKey] = useState<string>();

  const { data: progress, refetch } = useQuizProgress();

  // Both are set after mount: they read the viewer's clock, and rendering them
  // on the server would guarantee a hydration mismatch.
  const [nextResetAt, setNextResetAt] = useState<string>();
  const [dateLabel, setDateLabel] = useState<string>();

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    setDateKey(today);
    setResults(readDay(today));
    setDateLabel(
      formatDate(now, { day: "numeric", month: "short", year: "numeric" })
    );
    // Derived here rather than taken from /api/quiz/progress, which anonymous
    // visitors never get — the countdown is the reason to come back tomorrow and
    // they are exactly who it needs to reach.
    setNextResetAt(
      new Date((Math.floor(now.getTime() / 86_400_000) + 1) * 86_400_000).toISOString()
    );
  }, []);

  const onFinished = useCallback(
    (result: ModeResult) => {
      setResults((previous) => {
        const next = [...previous.filter((r) => r.mode !== result.mode), result];
        if (dateKey) {
          try {
            window.localStorage.setItem(
              RESULTS_KEY,
              JSON.stringify({ dateKey, results: next } satisfies StoredDay)
            );
          } catch {
            // Losing the scorecard is survivable; the individual boards persist.
          }
        }
        return next;
      });
      // The solve is already recorded — /api/quiz/guess counts guesses server-side
      // rather than taking the client's word, since that count is a leaderboard
      // position now. This only pulls the updated streak back.
      if (result.solved) void refetch();
    },
    [dateKey, refetch]
  );

  const nextTab = useCallback(() => {
    setTab((current) => TAB_ORDER[(TAB_ORDER.indexOf(current) + 1) % TAB_ORDER.length]!);
    setPracticeSeed(undefined);
  }, []);

  const solvedToday = results.filter((r) => r.solved).length;
  const streak = progress?.streak.current ?? 0;

  return (
    <div data-quiz>
      <QuizHero
        dateLabel={dateLabel}
        streak={streak}
        solvedToday={solvedToday}
        totalModes={QUIZ_MODES.length}
        nextResetAt={nextResetAt}
      />

      <div className="mx-auto w-full max-w-[1240px] px-5 pb-16 pt-5 md:px-8">
        <ModeStrip active={tab} results={results} onSelect={setTab} />

        <div className="mt-4 grid gap-4">
          {tab === "personal" && <PersonalQuiz />}
          {tab === "board" && <QuizLeaderboard />}
          {isPuzzle && (
            <QuizBoard
              key={`${mode}:${practiceSeed ?? "daily"}`}
              mode={mode}
              streak={streak}
              allResults={results}
              onFinished={onFinished}
              onNextMode={nextTab}
              practiceSeed={practiceSeed}
              onNextPractice={() => setPracticeSeed(newSeed())}
            />
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-label text-fg-4">
            {isPuzzle ? (
              <button
                type="button"
                onClick={() => setPracticeSeed(practiceSeed ? undefined : newSeed())}
                className="underline-offset-2 hover:text-fg-2 hover:underline"
              >
                {practiceSeed ? "Back to today's puzzle" : "Practice mode · unlimited, no streak"}
              </button>
            ) : (
              <span />
            )}
            <span>Solving any one mode keeps your streak alive — you do not need all eight</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Random enough that two players are not handed the same practice puzzle. */
function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
