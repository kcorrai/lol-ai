"use client";

import { useEffect, useState } from "react";
import { remainingMs } from "@/domains/draft";
import type { DraftGameState, DraftSeriesState } from "@/domains/draft";

interface Props {
  state: DraftSeriesState;
  game: DraftGameState;
  /** Add to `Date.now()` to get the server's clock. */
  skewMs: number;
}

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The countdown, computed rather than transported (ADR-016 §4).
 *
 * The server publishes when the turn began; every client derives the rest. That
 * makes the clock exact and free — a poll is only needed to learn that the turn
 * *changed*, not to watch it tick. It is display-only: expiry is settled
 * server-side on the next read or write, so a slow machine cannot lose a turn
 * its opponent still sees as live.
 */
export function TurnClock({ state, game, skewMs }: Props): React.ReactElement | null {
  const [tenths, setTenths] = useState(0);

  useEffect(() => {
    let frame = 0;
    const tick = (): void => {
      const left = remainingMs(state, game, Date.now() + skewMs);
      // Only re-render when the tenth changes — the ring stays smooth without
      // paying for a state update every frame.
      setTenths((current) => {
        const next = left === null ? -1 : Math.ceil(left / 100);
        return next === current ? current : next;
      });
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [game, skewMs, state]);

  if (tenths < 0 || state.timerSeconds === 0 || game.phase !== "IN_PROGRESS") return null;

  const seconds = Math.ceil(tenths / 10);
  const fraction = Math.max(0, Math.min(1, tenths / (state.timerSeconds * 10)));
  const tone = seconds <= 5 ? "text-danger" : seconds <= 10 ? "text-warning" : "text-accent";

  return (
    <div
      className="relative flex h-10 w-10 shrink-0 items-center justify-center"
      role="timer"
      aria-label={`${seconds} seconds left`}
    >
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 40 40" aria-hidden>
        <circle cx="20" cy="20" r={RADIUS} fill="none" strokeWidth="3" className="stroke-line-1" />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          className={`${tone} stroke-current transition-[stroke-dashoffset] duration-100 ease-linear`}
        />
      </svg>
      <span className={`font-mono text-[13px] font-bold tabular-nums ${tone}`}>{seconds}</span>
    </div>
  );
}
