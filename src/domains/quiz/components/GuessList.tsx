"use client";

import { Check, X } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { GuessResult } from "@/domains/quiz";

/** The guess history for every mode except Classic, whose grid is its own record. */
export function GuessList({ results }: { results: GuessResult[] }): React.JSX.Element | null {
  if (results.length === 0) return null;

  return (
    <ol className="grid gap-1.5">
      {[...results].reverse().map((result, index) => (
        <li
          key={result.guess}
          className={`tag-cut flex animate-hud-enter items-center gap-2.5 border px-3 py-2 ${
            result.correct ? "bg-accent/12 border-accent" : "border-line-2 bg-surface-dark"
          }`}
        >
          <span className="font-mono text-[10.5px] tabular-nums text-fg-4">
            {String(results.length - index).padStart(2, "0")}
          </span>
          <ChampionIcon name={result.guess} size={24} />
          <span className={`flex-1 text-[13px] ${result.correct ? "text-accent" : "text-fg-2"}`}>
            {result.guess}
          </span>
          {result.hint && (
            <span
              className="tag-cut border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-label text-warning"
              title="Clue unlocked by this miss"
            >
              {result.hint}
            </span>
          )}
          {result.correct ? (
            <Check className="h-4 w-4 shrink-0 text-accent" aria-label="correct" />
          ) : (
            <X className="h-4 w-4 shrink-0 text-fg-4" aria-label="wrong" />
          )}
        </li>
      ))}
    </ol>
  );
}
