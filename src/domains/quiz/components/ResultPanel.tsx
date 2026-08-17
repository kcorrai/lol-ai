"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { buildShareGrid, type ModeResult, type QuizMode } from "@/domains/quiz";

interface ResultPanelProps {
  mode: QuizMode;
  puzzleNumber: number;
  answer: { id: string; name: string; title: string };
  guessCount: number;
  solved: boolean;
  streak: number;
  /** Every mode played today, so the share card is a day's scorecard not one row. */
  allResults: ModeResult[];
}

export function ResultPanel({
  puzzleNumber,
  answer,
  guessCount,
  solved,
  streak,
  allResults,
}: ResultPanelProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  const share = buildShareGrid({ puzzleNumber, results: allResults, streak });

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(share);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard is blocked in some embedded browsers; the text is on screen
      // anyway, so there is nothing to recover from.
    }
  }

  return (
    <div
      className={`notch border p-4 ${solved ? "border-accent/40 bg-accent/8" : "border-line-2 bg-surface-dark"}`}
    >
      <div className="flex items-center gap-3">
        <ChampionIcon name={answer.name} size={44} />
        <div className="min-w-0">
          <p className="hud-label">{solved ? `Solved in ${guessCount}` : "The answer was"}</p>
          <p className="font-display text-lg font-bold uppercase tracking-wide text-fg-1">
            {answer.name}
          </p>
          <p className="truncate text-[12px] text-fg-3">{answer.title}</p>
        </div>
      </div>

      <pre className="notch-sm mt-3.5 overflow-x-auto whitespace-pre border border-line-2 bg-surface p-3 font-mono text-[11.5px] leading-relaxed text-fg-2">
        {share}
      </pre>

      <button
        type="button"
        onClick={copy}
        className="notch-sm mt-2.5 inline-flex items-center gap-2 border border-accent/50 bg-accent/12 px-3.5 py-2 font-mono text-[11px] uppercase tracking-label text-accent transition-colors hover:bg-accent/20"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy result"}
      </button>

      <p className="mt-2 font-mono text-[10.5px] text-fg-4">
        Names no champion — safe to post before your friends have played.
      </p>
    </div>
  );
}
