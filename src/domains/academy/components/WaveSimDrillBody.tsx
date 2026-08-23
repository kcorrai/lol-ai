"use client";

import { useState } from "react";
import {
  simulateWave,
  WAVE_ACTIONS,
  type WaveAction,
  type WaveGoal,
} from "@/domains/academy/drills/waveSim";
import type { WaveSimDrill } from "@/domains/academy/types";

interface WaveSimDrillBodyProps {
  drill: WaveSimDrill;
  locked: boolean;
  onSubmit: (actions: string[]) => void;
}

const ACTION_LABEL: Record<WaveAction, string> = {
  clear: "Clear the wave",
  thin: "Kill two early",
  "last-hit": "Last-hit only",
  hold: "Leave it alone",
};

const GOAL_LABEL: Record<WaveGoal, string> = {
  freeze: "Freeze it just outside your turret",
  "slow-push": "Build a slow push that has not crashed yet",
  crash: "Crash it into their turret",
};

/** −3 is your turret and +3 is theirs, so the track reads left to right the way the lane does. */
function trackPercent(position: number): number {
  return ((position + 3) / 6) * 100;
}

export function WaveSimDrillBody({
  drill,
  locked,
  onSubmit,
}: WaveSimDrillBodyProps): React.ReactElement {
  const [actions, setActions] = useState<WaveAction[]>([]);

  const states = simulateWave(drill.start, actions);
  const current = states[states.length - 1];
  const spent = actions.length;
  const done = spent >= drill.cycles;

  function choose(action: WaveAction): void {
    if (locked || done) return;
    const next = [...actions, action];
    setActions(next);
    // The last cycle is the answer: there is nothing left to decide, so submitting it here
    // saves a confirm button that could only ever mean "yes, the thing I already did".
    if (next.length === drill.cycles) onSubmit(next);
  }

  return (
    <div className="mt-4">
      <p className="hud-label text-accent">Goal — {GOAL_LABEL[drill.goal]}</p>

      <div className="notch-sm mt-3 border border-line-1 bg-surface-dark p-4">
        <div className="flex items-center justify-between font-mono text-[11px] uppercase tracking-label text-text-muted">
          <span>Your turret</span>
          <span>Their turret</span>
        </div>

        <div className="relative mt-2 h-8">
          <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-line-2" />
          <div
            className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-accent bg-surface transition-[left] duration-500"
            style={{ left: `${trackPercent(current.position)}%` }}
          />
        </div>

        <div className="mt-1 flex items-baseline gap-2">
          <span className="font-mono text-[11px] uppercase tracking-label text-text-muted">
            Minion count
          </span>
          <span
            className={`font-mono text-[13px] ${
              current.advantage > 0
                ? "text-accent"
                : current.advantage < 0
                  ? "text-danger"
                  : "text-text-body"
            }`}
          >
            {current.advantage > 0
              ? `+${current.advantage} yours`
              : current.advantage < 0
                ? `${-current.advantage} theirs`
                : "even"}
          </span>
        </div>
      </div>

      <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-text-muted">
        {done ? `${drill.cycles} cycles played` : `Cycle ${spent + 1} of ${drill.cycles}`}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2">
        {WAVE_ACTIONS.map((action) => (
          <button
            key={action}
            type="button"
            disabled={locked || done}
            onClick={() => choose(action)}
            className="notch-sm border border-line-1 px-3 py-2 text-left text-[13px] text-text-body transition-colors hover:border-line-3 disabled:opacity-40 disabled:hover:border-line-1"
          >
            {ACTION_LABEL[action]}
          </button>
        ))}
      </div>

      {spent > 0 && (
        <ol className="mt-3 flex flex-wrap gap-1.5">
          {actions.map((action, index) => (
            <li
              key={`${action}-${index}`}
              className="notch-sm border border-line-1 px-2 py-1 font-mono text-[11px] text-text-muted"
            >
              {index + 1}. {ACTION_LABEL[action]}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
