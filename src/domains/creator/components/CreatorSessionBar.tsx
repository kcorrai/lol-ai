"use client";

import { KeyRound, RotateCcw } from "lucide-react";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import { formatLpDelta } from "@/domains/creator/lp";
import type { CreatorKit, OverlayPayload } from "@/domains/creator/types";

// Where the session the whole kit counts against is set and read.
//
// It sits above the tabs because every overlay and every chat reply is measured
// from it: a creator who has just gone live wants one control, not one buried in
// a settings tab they have to remember to visit.

/**
 * Local wall clock, formatted by hand.
 *
 * `toLocaleTimeString` would pick 12- or 24-hour from the browser's locale, and
 * the session start is read next to a 24-hour figure the overlay prints.
 */
function clock(iso: string): string {
  const at = new Date(iso);
  return `${String(at.getHours()).padStart(2, "0")}:${String(at.getMinutes()).padStart(2, "0")}`;
}

export function CreatorSessionBar({
  kit,
  preview,
  busy,
  onStartSession,
  onCountFromMidnight,
  onRollKey,
}: {
  kit: CreatorKit;
  preview: OverlayPayload | null;
  busy: boolean;
  onStartSession: () => void;
  onCountFromMidnight: () => void;
  onRollKey: () => void;
}): JSX.Element {
  const manualStart = kit.sessionStartedAt !== null;
  const session = preview?.session ?? null;
  const lpDelta = preview?.rank?.sessionLpDelta ?? null;

  return (
    <div className="notch flex flex-wrap items-center justify-between gap-5 border border-line-1 bg-surface px-5 py-4">
      <div className="flex min-w-0 flex-wrap items-center gap-6">
        <div>
          <p className="hud-label">Session</p>
          <p className="mt-1.5 flex items-baseline gap-2.5">
            <span className="font-mono text-xl font-bold text-text">
              {manualStart ? clock(kit.sessionStartedAt as string) : "00:00"}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-label text-text-faint">
              {manualStart ? "manual start" : "since midnight"}
            </span>
          </p>
        </div>
        <span aria-hidden className="h-[34px] w-px bg-line-1" />
        <StatBlock label="Games" value={session ? String(session.games) : "—"} />
        <StatBlock
          label="Record"
          value={session ? `${session.wins}W ${session.losses}L` : "—"}
          unit={session?.winRate !== null && session ? `${session.winRate}%` : undefined}
        />
        <StatBlock
          label="LP"
          value={lpDelta === null ? "—" : formatLpDelta(lpDelta)}
          deltaTone={lpDelta !== null && lpDelta < 0 ? "bad" : "good"}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onStartSession}
          disabled={busy}
          className="tag-cut flex items-center gap-2 border border-line-2 bg-ink-1000 px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-text-body transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Start a new session
        </button>
        {manualStart && (
          <button
            type="button"
            onClick={onCountFromMidnight}
            disabled={busy}
            className="tag-cut px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-text-muted transition-colors hover:text-accent disabled:opacity-50"
          >
            Count from midnight instead
          </button>
        )}
        <button
          type="button"
          onClick={onRollKey}
          disabled={busy}
          className="tag-cut flex items-center gap-2 border border-danger/40 px-3.5 py-2 font-display text-xs font-bold uppercase tracking-wider text-danger transition-colors hover:border-danger disabled:opacity-50"
        >
          <KeyRound className="h-3.5 w-3.5" />
          Roll key
        </button>
      </div>
    </div>
  );
}
