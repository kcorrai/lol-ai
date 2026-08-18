"use client";

import type { ReactNode } from "react";

// The frame every widget sits in.
//
// Two things it must do that a normal card need not. The background is
// transparent by default, because an OBS Browser Source composites onto the
// streamer's scene rather than a page. And the accent is applied as an inline
// custom property rather than a Tailwind class, because it is a per-creator
// value that cannot be known at build time.

export interface OverlayShellProps {
  accentColor: string;
  theme: string;
  children: ReactNode;
}

function surfaceFor(theme: string): string {
  if (theme === "light") return "bg-white/85 text-ink-900";
  if (theme === "transparent") return "bg-transparent text-fg-1";
  return "bg-ink-900/80 text-fg-1";
}

export function OverlayShell({ accentColor, theme, children }: OverlayShellProps): JSX.Element {
  return (
    <div
      className={`inline-flex flex-col gap-1 rounded-lg border border-line-2/60 px-4 py-3 font-sans backdrop-blur-sm ${surfaceFor(theme)}`}
      style={{ ["--overlay-accent" as string]: accentColor }}
    >
      {children}
    </div>
  );
}

/** The small label above a figure. */
export function OverlayLabel({ children }: { children: ReactNode }): JSX.Element {
  return (
    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-fg-3">
      {children}
    </span>
  );
}

/** A figure in the creator's accent colour. */
export function OverlayAccent({ children }: { children: ReactNode }): JSX.Element {
  return <span style={{ color: "var(--overlay-accent)" }}>{children}</span>;
}

/**
 * The mark that pays for this being free on every plan — it is our name on the
 * streamer's canvas, which is the whole reason the kit is not a paid feature
 * (ADR-026).
 */
export function OverlayBadge(): JSX.Element {
  return (
    <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.22em] text-fg-4">
      laneiq.gg
    </span>
  );
}
