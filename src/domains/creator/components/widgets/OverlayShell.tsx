"use client";

import type { ReactNode } from "react";

// The frame every widget sits in.
//
// Two things it must do that a normal card need not. The background is
// transparent by default, because an OBS Browser Source composites onto the
// streamer's scene rather than a page. And the accent is applied as an inline
// custom property rather than a Tailwind class, because it is a per-creator
// value that cannot be known at build time.
//
// The chamfered corner and the acid-tinted outline are the app's own HUD frame
// (ADR-015) carried onto the streamer's canvas, so an overlay reads as part of
// LaneIQ from across a stream rather than as a generic stat box.

export interface OverlayShellProps {
  accentColor: string;
  theme: string;
  children: ReactNode;
}

function surfaceFor(theme: string): string {
  if (theme === "light")
    return "bg-[rgba(240,246,242,.96)] border-[rgba(20,28,26,.18)] text-ink-800";
  if (theme === "transparent") return "bg-transparent border-transparent text-fg-1";
  return "bg-[rgba(8,11,10,.88)] border-[rgba(198,255,61,.22)] text-fg-1";
}

export function OverlayShell({ accentColor, theme, children }: OverlayShellProps): JSX.Element {
  return (
    <div
      className={`tag-cut inline-flex flex-col gap-1 border px-5 py-4 font-sans backdrop-blur-sm ${surfaceFor(theme)}`}
      style={{ ["--overlay-accent" as string]: accentColor }}
    >
      {children}
    </div>
  );
}

/** The small label above a figure. */
export function OverlayLabel({ children }: { children: ReactNode }): JSX.Element {
  return (
    <span className="font-mono text-[10px] uppercase tracking-label text-fg-3">{children}</span>
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
  // fg-3 rather than fg-4. At fg-4 it was legible on the dark card in a browser
  // and effectively invisible once composited over stream footage — which
  // defeats the one thing it is there to do.
  return (
    <span className="mt-1.5 font-mono text-[10px] uppercase tracking-label text-fg-3">
      laneiq.gg
    </span>
  );
}
