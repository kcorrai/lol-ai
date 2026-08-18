"use client";

import type { LucideIcon } from "lucide-react";

/**
 * The stage every mode plays on: one chamfered panel that holds the header, the
 * puzzle, the clue rail and whatever bar the mode ends on. It takes the accent
 * border only once the puzzle is solved, so the frame itself reports the result.
 */
export function StageShell({
  solved,
  children,
}: {
  solved?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <section
      className={`notch-lg overflow-hidden border bg-surface ${
        solved ? "glow-accent-soft border-accent" : "border-line-1"
      }`}
    >
      {children}
    </section>
  );
}

const PIPS = 5;

interface StageHeaderProps {
  icon: LucideIcon;
  label: string;
  /** `#412` for the daily puzzle, `PRACTICE` off the clock. */
  tag?: string;
  /** Replaces the guess counter for the modes that are not guessed at. */
  note?: string;
  guessCount?: number;
  misses?: number;
}

export function StageHeader({
  icon: Icon,
  label,
  tag,
  note,
  guessCount = 0,
  misses = 0,
}: StageHeaderProps): React.JSX.Element {
  // The pips are the clue ladder in miniature: how far into the reveal this
  // puzzle has been pushed, readable without moving your eyes to the rail.
  const lit = Math.min(PIPS, misses + 1);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3.5 border-b border-line-1 bg-surface-2 px-5 py-3.5">
      <span className="flex items-center gap-2.5">
        <Icon aria-hidden className="h-[18px] w-[18px] text-accent" />
        <h2 className="font-display text-[17px] font-extrabold uppercase tracking-wide text-fg-1">
          {label}
        </h2>
        {tag && (
          <span className="font-mono text-[10px] uppercase tracking-label text-fg-4">{tag}</span>
        )}
      </span>

      {note ? (
        <span className="font-mono text-[10.5px] uppercase tracking-label text-fg-3">{note}</span>
      ) : (
        <span className="flex items-center gap-3.5">
          <span className="font-mono text-[10.5px] uppercase tracking-label text-fg-3">
            {guessCount} {guessCount === 1 ? "guess" : "guesses"}
          </span>
          <span aria-hidden className="flex gap-1">
            {Array.from({ length: PIPS }, (_, i) => (
              <span key={i} className={`h-[3px] w-3.5 ${i < lit ? "bg-acid-500" : "bg-ink-400"}`} />
            ))}
          </span>
        </span>
      )}
    </header>
  );
}
