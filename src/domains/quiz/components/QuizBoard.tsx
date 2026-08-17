"use client";

import { useEffect, useState } from "react";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyQuiz } from "@/hooks/useDailyQuiz";
import { useQuizGame, type QuizGameState } from "@/hooks/useQuizGame";
import type { ModeResult, QuizMode } from "@/domains/quiz";
import { ChampionGuessInput } from "./ChampionGuessInput";
import { ClassicGrid } from "./ClassicGrid";
import { GuessList } from "./GuessList";
import { MODE_LABELS } from "./ModeTabs";
import { PuzzlePrompt } from "./PuzzlePrompt";
import { ResultPanel } from "./ResultPanel";

interface QuizBoardProps {
  mode: QuizMode;
  streak: number;
  /** Every mode finished today, so the share card is a scorecard not one row. */
  allResults: ModeResult[];
  onFinished: (result: ModeResult) => void;
}

export function QuizBoard({
  mode,
  streak,
  allResults,
  onFinished,
}: QuizBoardProps): React.JSX.Element {
  // Set after mount rather than during render: it feeds a localStorage key, and
  // computing it on the server would pin the board to the server's day.
  const [dateKey, setDateKey] = useState<string>();
  useEffect(() => setDateKey(new Date().toISOString().slice(0, 10)), []);

  const game = useQuizGame(dateKey, mode);
  const { data, isLoading, isError } = useDailyQuiz(mode, game.misses);

  const finished = game.state.solved || game.state.gaveUp;

  function report(next: QuizGameState | null): void {
    if (!next || (!next.solved && !next.gaveUp)) return;
    onFinished({ mode, guessCount: next.results.length, solved: next.solved });
  }

  if (isLoading) {
    return (
      <HudPanel className="space-y-3 p-4 md:p-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-10 w-full" />
      </HudPanel>
    );
  }

  if (isError || !data) {
    return (
      <HudPanel className="p-5">
        <p className="text-sm text-fg-2">
          Today&apos;s {MODE_LABELS[mode]} puzzle could not be loaded. Refresh to try again.
        </p>
      </HudPanel>
    );
  }

  const { puzzle, champions } = data;

  return (
    <HudPanel className="space-y-4 p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-fg-1">
          {MODE_LABELS[mode]}
        </h2>
        <span className="font-mono text-[10.5px] text-fg-4">#{puzzle.puzzleNumber}</span>
      </div>

      <PuzzlePrompt prompt={puzzle.prompt} misses={game.misses} revealed={finished} />

      {!finished && (
        <>
          <HudRule label="// YOUR GUESS" />
          <ChampionGuessInput
            champions={champions}
            alreadyGuessed={game.state.results.map((r) => r.guess)}
            disabled={game.pending}
            onGuess={(name) => void game.submit(name).then(report)}
          />
          {game.error && (
            <p role="alert" className="text-[12px] text-danger">
              {game.error}
            </p>
          )}
          <div className="flex items-center justify-between gap-3">
            <span className="font-mono text-[10.5px] text-fg-4">
              {game.misses === 0
                ? "Unlimited guesses — each miss reveals a little more"
                : `${game.misses} ${game.misses === 1 ? "miss" : "misses"}`}
            </span>
            <button
              type="button"
              onClick={() => void game.giveUp().then(report)}
              className="font-mono text-[10.5px] uppercase tracking-label text-fg-4 underline-offset-2 hover:text-fg-2 hover:underline"
            >
              Give up
            </button>
          </div>
        </>
      )}

      {finished && game.state.answer && (
        <ResultPanel
          mode={mode}
          puzzleNumber={puzzle.puzzleNumber}
          answer={game.state.answer}
          guessCount={game.state.results.length}
          solved={game.state.solved}
          streak={streak}
          allResults={allResults}
        />
      )}

      {mode === "classic" ? (
        <ClassicGrid results={game.state.results} />
      ) : (
        <GuessList results={game.state.results} />
      )}
    </HudPanel>
  );
}
