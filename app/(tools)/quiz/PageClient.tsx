"use client";

import { useCallback, useEffect, useState } from "react";
import { Flame } from "lucide-react";
import { HudPanel } from "@/components/dashboard/laneiq/HudPanel";
import { QUIZ_MODES, type ModeResult, type QuizMode } from "@/domains/quiz";
import { ModeTabs } from "@/domains/quiz/components/ModeTabs";
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

export default function QuizPage(): React.JSX.Element {
  const [mode, setMode] = useState<QuizMode>("classic");
  const [results, setResults] = useState<ModeResult[]>([]);
  const [dateKey, setDateKey] = useState<string>();

  const { data: progress, refetch } = useQuizProgress();

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    setDateKey(today);
    setResults(readDay(today));
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
      // Signed-in players get the solve recorded and the streak advanced; for
      // everyone else this is a no-op the endpoint answers with 401.
      if (result.solved) void recordSolve(result).then(() => void refetch());
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
        {progress?.nextResetAt && <ResetCountdown nextResetAt={progress.nextResetAt} />}
      </HudPanel>

      <div className="mb-4">
        <ModeTabs active={mode} done={done} onSelect={setMode} />
      </div>

      <QuizBoard key={mode} mode={mode} streak={streak} allResults={results} onFinished={onFinished} />

      <p className="mt-5 text-center font-mono text-[10.5px] text-fg-4">
        Solving any one mode keeps your streak alive — you do not need all six.
      </p>
    </div>
  );
}

async function recordSolve(result: ModeResult): Promise<void> {
  try {
    await fetch("/api/quiz/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: result.mode,
        guessCount: result.guessCount ?? 0,
        solved: result.solved,
      }),
    });
  } catch {
    // The board is client-authoritative; a failed sync costs the streak a day,
    // not the game.
  }
}
