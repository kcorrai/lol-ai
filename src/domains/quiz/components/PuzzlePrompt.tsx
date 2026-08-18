"use client";

import type { QuizPrompt } from "@/domains/quiz";
import { EMOJI_PER_CHAMPION } from "@/domains/quiz/services/clueLadder";

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

/** The chamfered art frame every visual mode is set in. */
function Frame({
  badge,
  square,
  children,
}: {
  badge: string;
  square?: boolean;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      className={`notch relative w-full overflow-hidden border border-line-1 bg-surface-dark ${
        square ? "mx-auto aspect-square max-w-[300px]" : "aspect-video"
      }`}
    >
      {children}
      <span className="tag-cut absolute left-3 top-3 border border-accent bg-ink-1000/70 px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-micro text-accent">
        {badge}
      </span>
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <p className="text-center font-mono text-[11px] uppercase tracking-label text-fg-3">
      {children}
    </p>
  );
}

export function PuzzlePrompt({ prompt, misses, revealed }: PuzzlePromptProps): React.JSX.Element {
  switch (prompt.kind) {
    case "classic":
      return (
        <p className="font-mono text-[11px] uppercase tracking-label text-fg-3">
          Guess the champion — every guess is compared column by column
        </p>
      );

    case "ability":
      return (
        <div className="grid animate-quiz-stage justify-items-center gap-4">
          <Frame badge="Ability icon" square>
            {/* eslint-disable-next-line @next/next/no-img-element -- proxied bytes,
                not a Data Dragon URL, so next/image has no domain to optimise for */}
            <img
              src={prompt.assetUrl}
              alt="Today's mystery ability icon"
              width={128}
              height={128}
              // Data Dragon serves the icon at 64px. Doubling it exactly keeps
              // every pixel square instead of smearing it through a resampler.
              className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 [image-rendering:pixelated]"
            />
          </Frame>
          <Caption>Which champion does this ability belong to?</Caption>
        </div>
      );

    case "splash":
      return (
        <div className="grid animate-quiz-stage gap-4">
          <Frame badge={revealed ? "Full art" : `Zoom ${splashScale(misses, revealed).toFixed(1)}×`}>
            {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
            <img
              src={prompt.assetUrl}
              alt="Today's mystery splash art"
              className="h-full w-full object-cover transition-transform duration-500 ease-out"
              style={{ transform: `scale(${splashScale(misses, revealed)})` }}
            />
          </Frame>
          <Caption>{revealed ? "The full splash" : "Each miss pulls the camera back"}</Caption>
        </div>
      );

    case "lore":
      return (
        <blockquote className="notch bg-scanline relative animate-quiz-stage overflow-hidden border border-line-1 border-l-2 border-l-accent bg-surface-dark px-6 py-5">
          <p className="max-w-[64ch] text-[15px] leading-[1.7] text-fg-1">{prompt.text}</p>
          <footer className="mt-4 font-mono text-[10px] uppercase tracking-label text-fg-4">
            Names, titles and abilities are blanked out
          </footer>
        </blockquote>
      );

    case "quote":
      return (
        <blockquote className="notch bg-scanline relative flex min-h-[190px] animate-quiz-stage flex-col justify-center overflow-hidden border border-line-1 border-l-2 border-l-accent bg-surface-dark px-7 py-6">
          <p className="font-mono text-[10px] uppercase tracking-label text-accent">
            {"// Voice line"}
          </p>
          <p className="mt-3.5 max-w-[26ch] font-display text-[26px] font-bold leading-[1.28] text-fg-1">
            &ldquo;{prompt.text}&rdquo;
          </p>
          <footer className="mt-3.5 font-mono text-[10px] uppercase tracking-label text-fg-4">
            Who says this?
          </footer>
        </blockquote>
      );

    case "emoji": {
      const slots = Array.from({ length: EMOJI_PER_CHAMPION }, (_, i) => prompt.emojis[i]);
      return (
        <div className="grid animate-quiz-stage justify-items-center gap-5 py-3">
          <div
            className="flex flex-wrap justify-center gap-3"
            aria-label={`Emoji clues: ${prompt.emojis.join(", ")}`}
          >
            {slots.map((glyph, index) => (
              <span
                key={index}
                aria-hidden
                className={`notch grid h-[68px] w-[68px] place-items-center border ${
                  glyph
                    ? "animate-quiz-flip border-accent bg-surface-dark text-[30px] text-fg-1"
                    : "border-line-2 bg-surface-dark font-mono text-[20px] text-fg-4"
                } ${index === prompt.emojis.length - 1 ? "glow-accent-soft" : ""}`}
                style={glyph ? { animationDelay: `${index * 90}ms` } : undefined}
              >
                {glyph ?? "?"}
              </span>
            ))}
          </div>
          <Caption>
            {prompt.emojis.length} of {EMOJI_PER_CHAMPION} clues revealed — each miss reveals another
          </Caption>
        </div>
      );
    }
  }
}
