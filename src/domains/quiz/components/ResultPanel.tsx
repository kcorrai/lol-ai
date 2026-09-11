"use client";

import { ArrowRight } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { ModeResult } from "@/domains/quiz";
import { ShareCard } from "./ShareCard";

interface ResultPanelProps {
  puzzleNumber: number;
  answer: { id: string; name: string; title: string };
  guessCount: number;
  solved: boolean;
  streak: number;
  /** Every mode played today, so the share card is a day's scorecard not one row. */
  allResults: ModeResult[];
  onNextMode: () => void;
}

/**
 * The end of a puzzle, on the bottom edge of the stage: what the answer was, how
 * it went, and the two things a player does next — post it, or play the next mode.
 */
export function ResultPanel({
  puzzleNumber,
  answer,
  guessCount,
  solved,
  streak,
  allResults,
  onNextMode,
}: ResultPanelProps): React.JSX.Element {
  return (
    <div
      className={`animate-quiz-rise border-t ${
        solved ? "border-accent bg-accent/10" : "border-line-2 bg-surface-dark"
      }`}
    >
      <div className="relative flex flex-wrap items-center gap-4 overflow-hidden px-5 py-4">
        {solved && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-[22%] animate-quiz-sweep bg-gradient-to-r from-transparent via-accent/20 to-transparent"
          />
        )}
        <ChampionIcon
          name={answer.name}
          size={46}
          className={solved ? "border border-accent" : "border border-line-2"}
        />
        <div className="min-w-0">
          <p
            className={`font-display text-[18px] font-extrabold uppercase tracking-wide ${
              solved ? "text-accent" : "text-fg-2"
            }`}
          >
            {solved
              ? `Solved in ${guessCount} ${guessCount === 1 ? "guess" : "guesses"}`
              : "The answer was"}
          </p>
          <p className="mt-1 font-mono text-[10.5px] uppercase tracking-label text-fg-3">
            {answer.name} · {answer.title}
          </p>
        </div>

        <button
          type="button"
          onClick={onNextMode}
          className="tag-cut btn-glow ml-auto flex items-center gap-2 border border-accent bg-accent px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-label text-ink-1000 hover:bg-acid-400"
        >
          Next mode
          <ArrowRight aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="border-t border-line-1 px-5 py-4">
        <ShareCard puzzleNumber={puzzleNumber} results={allResults} streak={streak} />
      </div>
    </div>
  );
}
