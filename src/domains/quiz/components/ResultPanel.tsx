"use client";

import { useState } from "react";
import { ArrowRight, Check, Share2 } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { buildShareGrid, type ModeResult } from "@/domains/quiz";

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
  const [copied, setCopied] = useState(false);

  const share = buildShareGrid({ puzzleNumber, results: allResults, streak });

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some embedded browsers; the block below is on
      // screen anyway, so there is nothing to recover from.
    }
  }

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

        <div className="relative ml-auto flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={copy}
            className="tag-cut flex items-center gap-2 border border-line-2 bg-surface-2 px-3.5 py-2 font-mono text-[11px] uppercase tracking-label text-fg-1 transition-colors hover:border-accent hover:text-accent"
          >
            {copied ? (
              <Check aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <Share2 aria-hidden className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Share result"}
          </button>
          <button
            type="button"
            onClick={onNextMode}
            className="tag-cut btn-glow flex items-center gap-2 border border-accent bg-accent px-3.5 py-2 font-mono text-[11px] font-bold uppercase tracking-label text-ink-1000 hover:bg-acid-400"
          >
            Next mode
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="px-5 pb-4">
        <pre className="tag-cut overflow-x-auto whitespace-pre border border-line-2 bg-surface-dark p-3 font-mono text-[11.5px] leading-relaxed text-fg-2">
          {share}
        </pre>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-label text-fg-4">
          Names no champion — safe to post before your friends have played
        </p>
      </div>
    </div>
  );
}
