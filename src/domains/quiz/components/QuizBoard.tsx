"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useDailyQuiz } from "@/hooks/useDailyQuiz";
import { useQuizGame, type QuizGameState } from "@/hooks/useQuizGame";
import type { ModeResult, QuizMode } from "@/domains/quiz";
import { ClassicGrid } from "./ClassicGrid";
import { ClueLadder } from "./ClueLadder";
import { GuessArea } from "./GuessArea";
import { GuessList } from "./GuessList";
import { MODE_ICONS, MODE_LABELS } from "./ModeStrip";
import { PuzzlePrompt } from "./PuzzlePrompt";
import { ResultPanel } from "./ResultPanel";
import { StageShell, StageHeader } from "./StageShell";

interface QuizBoardProps {
  mode: QuizMode;
  streak: number;
  /** Every mode finished today, so the share card is a scorecard not one row. */
  allResults: ModeResult[];
  onFinished: (result: ModeResult) => void;
  onNextMode: () => void;
  /** Set in practice mode. No streak, no share card, no record kept. */
  practiceSeed?: string;
  onNextPractice?: () => void;
}

export function QuizBoard({
  mode,
  streak,
  allResults,
  onFinished,
  onNextMode,
  practiceSeed,
  onNextPractice,
}: QuizBoardProps): React.JSX.Element {
  // Set after mount rather than during render: it feeds a localStorage key, and
  // computing it on the server would pin the board to the server's day.
  const [dateKey, setDateKey] = useState<string>();
  useEffect(() => setDateKey(new Date().toISOString().slice(0, 10)), []);

  const game = useQuizGame(dateKey, mode, practiceSeed);
  const { data, isLoading, isError } = useDailyQuiz(mode, game.misses, practiceSeed);

  const finished = game.state.solved || game.state.gaveUp;
  const Icon = MODE_ICONS[mode];

  function report(next: QuizGameState | null): void {
    // A practice round is not part of the day: it must not touch the scorecard,
    // the streak or the share card.
    if (practiceSeed || !next || (!next.solved && !next.gaveUp)) return;
    onFinished({ mode, guessCount: next.results.length, solved: next.solved });
  }

  if (isLoading) {
    return (
      <StageShell>
        <div className="grid gap-3 p-5">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      </StageShell>
    );
  }

  if (isError || !data) {
    return (
      <StageShell>
        <p className="p-5 text-sm text-fg-2">
          Today&apos;s {MODE_LABELS[mode]} puzzle could not be loaded. Refresh to try again.
        </p>
      </StageShell>
    );
  }

  const { puzzle } = data;
  const hints = [...new Set(game.state.results.map((r) => r.hint).filter(Boolean))] as string[];

  return (
    <StageShell solved={game.state.solved}>
      <StageHeader
        icon={Icon}
        label={MODE_LABELS[mode]}
        tag={practiceSeed ? "PRACTICE" : `#${puzzle.puzzleNumber}`}
        guessCount={game.state.results.length}
        misses={game.misses}
      />

      <div className="grid lg:grid-cols-[minmax(0,1fr)_264px]">
        <div key={mode} className="grid min-w-0 animate-quiz-stage gap-4 p-5">
          <PuzzlePrompt prompt={puzzle.prompt} misses={game.misses} revealed={finished} />
          {mode === "classic" ? (
            <ClassicGrid results={game.state.results} />
          ) : (
            <GuessList results={game.state.results} />
          )}
        </div>
        <ClueLadder mode={mode} misses={game.misses} hints={hints} />
      </div>

      {!finished && (
        <div className="border-t border-line-1 px-5 py-4">
          <GuessArea
            puzzle={puzzle}
            champions={data.champions}
            alreadyGuessed={game.state.results.map((r) => r.guess)}
            disabled={game.pending}
            onGuess={(name) => void game.submit(name).then(report)}
          />
          {game.error && (
            <p role="alert" className="mt-2.5 text-[12px] text-danger">
              {game.error}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <span className="font-mono text-[10px] uppercase tracking-label text-fg-4">
              {game.misses === 0
                ? "Unlimited guesses — each miss reveals a little more"
                : `${game.misses} ${game.misses === 1 ? "miss" : "misses"}`}
            </span>
            <button
              type="button"
              onClick={() => void game.giveUp().then(report)}
              className="font-mono text-[10px] uppercase tracking-label text-fg-3 underline-offset-2 hover:text-fg-1 hover:underline"
            >
              Give up
            </button>
          </div>
        </div>
      )}

      {finished && practiceSeed && game.state.answer && (
        <div className="flex animate-quiz-rise flex-wrap items-center justify-between gap-3 border-t border-line-2 bg-surface-dark px-5 py-4">
          <div>
            <p className="hud-label">
              {game.state.solved ? `Solved in ${game.state.results.length}` : "The answer was"}
            </p>
            <p className="font-display text-lg font-bold uppercase tracking-wide text-fg-1">
              {game.state.answer.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onNextPractice}
            className="tag-cut btn-glow border border-accent bg-accent px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-label text-ink-1000 hover:bg-acid-400"
          >
            Next puzzle
          </button>
        </div>
      )}

      {finished && !practiceSeed && game.state.answer && (
        <ResultPanel
          puzzleNumber={puzzle.puzzleNumber}
          answer={game.state.answer}
          guessCount={game.state.results.length}
          solved={game.state.solved}
          streak={streak}
          allResults={allResults}
          onNextMode={onNextMode}
        />
      )}
    </StageShell>
  );
}
