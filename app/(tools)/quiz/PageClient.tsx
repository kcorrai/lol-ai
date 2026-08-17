"use client";

import { useCallback, useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { HudPanel } from "@/components/dashboard/laneiq/HudPanel";
import { QUIZ_MODES, type ModeResult, type QuizMode } from "@/domains/quiz";
import { ModeTabs } from "@/domains/quiz/components/ModeTabs";
import { PersonalQuiz } from "@/domains/quiz/components/PersonalQuiz";
import { QuizLeaderboard } from "@/domains/quiz/components/QuizLeaderboard";
import { QuizBoard } from "@/domains/quiz/components/QuizBoard";
import { ResetCountdown } from "@/domains/quiz/components/ResetCountdown";
import { useQuizProgress } from "@/hooks/useQuizProgress";

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

/** Two tabs are not QuizModes: the personal quiz has no daily answer to guess,
 *  and the leaderboard is not a puzzle at all. */
type Tab = QuizMode | "personal" | "board";

const EXTRA_TABS: { key: Extract<Tab, "personal" | "board">; label: string }[] = [
  { key: "personal", label: "Yours" },
  { key: "board", label: "Board" },
];

export default function QuizPage(): React.JSX.Element {
  const [tab, setTab] = useState<Tab>("classic");
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

  useEffect(() => {
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    setDateKey(today);
    setResults(readDay(today));
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

  const done = Object.fromEntries(
    results.map((r) => [r.mode, r.solved ? "solved" : "failed"])
  ) as Partial<Record<QuizMode, "solved" | "failed">>;

  const solvedToday = results.filter((r) => r.solved).length;
  const streak = progress?.streak.current ?? 0;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 md:px-6">
      <header className="mb-5">
        <p className="hud-label">Daily</p>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide text-fg-1 md:text-3xl">
          LaneIQ Daily
        </h1>
        <p className="mt-1.5 max-w-xl text-[13.5px] leading-relaxed text-fg-3">
          Six champion puzzles, new every day at midnight UTC. Unlimited guesses — every miss
          hands you a little more.
        </p>
      </header>

      <HudPanel className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <Flame className={`h-4 w-4 ${streak > 0 ? "text-accent" : "text-fg-4"}`} />
            <span className="font-mono text-[11px] text-fg-2">
              {streak > 0 ? `${streak} day streak` : "No streak yet"}
            </span>
          </span>
          <span className="font-mono text-[11px] text-fg-3">
            {solvedToday}/{QUIZ_MODES.length} solved today
          </span>
        </div>
        {nextResetAt && <ResetCountdown nextResetAt={nextResetAt} />}
      </HudPanel>

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        <ModeTabs active={isPuzzle ? tab : undefined} done={done} onSelect={setTab} />
        <span className="mx-1 hidden h-5 w-px bg-line-2 sm:block" />
        {EXTRA_TABS.map((extra) => (
          <button
            key={extra.key}
            role="tab"
            type="button"
            aria-selected={tab === extra.key}
            onClick={() => setTab(extra.key)}
            className={`notch-sm border px-3 py-1.5 font-mono text-[11px] uppercase tracking-label transition-colors ${
              tab === extra.key
                ? "border-accent bg-accent/15 text-accent"
                : "border-line-2 bg-surface-dark text-fg-3 hover:text-fg-1"
            }`}
          >
            {extra.label}
          </button>
        ))}
      </div>

      {tab === "personal" && <PersonalQuiz />}
      {tab === "board" && <QuizLeaderboard />}
      {isPuzzle && (
        <QuizBoard
          key={`${mode}:${practiceSeed ?? "daily"}`}
          mode={mode}
          streak={streak}
          allResults={results}
          onFinished={onFinished}
          practiceSeed={practiceSeed}
          onNextPractice={() => setPracticeSeed(newSeed())}
        />
      )}

      {isPuzzle && (
        <div className="mt-3 text-center">
          <button
            type="button"
            onClick={() => setPracticeSeed(practiceSeed ? undefined : newSeed())}
            className="font-mono text-[10.5px] uppercase tracking-label text-fg-4 underline-offset-2 hover:text-fg-2 hover:underline"
          >
            {practiceSeed ? "Back to today's puzzle" : "Practice — unlimited, no streak"}
          </button>
        </div>
      )}

      <p className="mt-5 text-center font-mono text-[10.5px] text-fg-4">
        Solving any one mode keeps your streak alive — you do not need all six.
      </p>
    </div>
  );
}

/** Random enough that two players are not handed the same practice puzzle. */
function newSeed(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
