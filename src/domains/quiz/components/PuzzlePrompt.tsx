"use client";

import type { QuizPrompt } from "@/domains/quiz";

interface PuzzlePromptProps {
  prompt: QuizPrompt;
  misses: number;
  revealed: boolean;
}

/**
 * The Splash crop. Each miss pulls the camera back, so a player who is stuck
 * keeps being handed more of the picture rather than staring at the same pixels.
 * The zoom is client-side on purpose: the same bytes serve the whole day, which
 * is what lets the asset response be cached until the next reset.
 */
function splashScale(misses: number, revealed: boolean): number {
  if (revealed) return 1;
  return Math.max(1, 5 - misses * 0.7);
}

export function PuzzlePrompt({ prompt, misses, revealed }: PuzzlePromptProps): React.JSX.Element {
  switch (prompt.kind) {
    case "classic":
      return (
        <p className="text-sm text-fg-3">
          Guess the champion. Every guess is compared against today&apos;s answer, column by column.
        </p>
      );

    case "ability":
      return (
        <div className="flex flex-col items-center gap-3 py-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- proxied bytes,
              not a Data Dragon URL, so next/image has no domain to optimise for */}
          <img
            src={prompt.assetUrl}
            alt="Today's mystery ability icon"
            width={128}
            height={128}
            className="notch-sm h-32 w-32 border border-line-2 bg-surface-dark"
          />
          <p className="hud-label">Which champion does this ability belong to?</p>
        </div>
      );

    case "splash":
      return (
        <div className="flex flex-col items-center gap-3 py-2">
          <div className="notch relative h-56 w-full max-w-lg overflow-hidden border border-line-2 bg-surface-dark">
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img
              src={prompt.assetUrl}
              alt="Today's mystery splash art"
              className="h-full w-full object-cover transition-transform duration-500 ease-out"
              style={{ transform: `scale(${splashScale(misses, revealed)})` }}
            />
          </div>
          <p className="hud-label">
            {revealed ? "The full splash" : "Each miss pulls the camera back"}
          </p>
        </div>
      );

    case "lore":
      return (
        <blockquote className="notch border-l-2 border-accent bg-surface-dark p-4 text-[13.5px] leading-relaxed text-fg-2">
          {prompt.text}
          <footer className="hud-label mt-3">
            Names, titles and abilities are blanked out
          </footer>
        </blockquote>
      );

    case "quote":
      return (
        <blockquote className="notch border-l-2 border-accent bg-surface-dark p-4">
          <p className="font-display text-lg leading-snug text-fg-1">
            &ldquo;{prompt.text}&rdquo;
          </p>
          <footer className="hud-label mt-3">Who says this?</footer>
        </blockquote>
      );

    case "emoji":
      return (
        <div className="flex flex-col items-center gap-3 py-2">
          <p className="text-4xl tracking-[0.2em]" aria-label={`Emoji clues: ${prompt.emojis.join(", ")}`}>
            {prompt.emojis.join("")}
          </p>
          <p className="hud-label">
            {prompt.emojis.length === 1
              ? "One clue so far — each miss reveals another"
              : `${prompt.emojis.length} clues revealed`}
          </p>
        </div>
      );
  }
}
