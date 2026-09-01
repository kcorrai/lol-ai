"use client";

import type { CSSProperties, ReactNode } from "react";

// The ground a widget preview is shown against.
//
// The checkerboard reads as "transparent" the way an image editor does, so the
// creator can see that the widget will composite onto their scene rather than
// sit on a black card. A light-themed widget gets a pale ground instead, or the
// pale card would vanish into the dark one.

const CHECKER: CSSProperties = {
  backgroundImage:
    "linear-gradient(45deg, rgba(233,245,238,.045) 25%, transparent 25%, transparent 75%, rgba(233,245,238,.045) 75%), linear-gradient(45deg, rgba(233,245,238,.045) 25%, transparent 25%, transparent 75%, rgba(233,245,238,.045) 75%)",
  backgroundSize: "18px 18px",
  backgroundPosition: "0 0, 9px 9px",
};

export function OverlayStage({
  theme,
  minHeight = 180,
  live = false,
  children,
}: {
  theme: string;
  minHeight?: number;
  /** The pulse that says the preview is the same payload OBS is being served. */
  live?: boolean;
  children: ReactNode;
}): JSX.Element {
  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden px-5 py-6 ${
        theme === "light" ? "bg-[rgba(233,245,238,.06)]" : "bg-ink-1000"
      }`}
      style={{ minHeight }}
    >
      <span aria-hidden className="absolute inset-0" style={CHECKER} />
      <span className="relative flex w-full max-w-[88%] justify-center">{children}</span>

      {live && (
        <span className="tag-cut absolute right-3 top-2.5 flex items-center gap-1.5 border border-accent/40 bg-ink-1000/70 px-2 py-1 font-mono text-[9px] uppercase tracking-micro text-accent">
          <span className="h-1 w-1 animate-glow-pulse bg-accent" />
          Live
        </span>
      )}
    </div>
  );
}
