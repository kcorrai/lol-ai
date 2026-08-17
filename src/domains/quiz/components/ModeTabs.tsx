"use client";

import { QUIZ_MODES, type QuizMode } from "@/domains/quiz";

export const MODE_LABELS: Record<QuizMode, string> = {
  classic: "Classic",
  ability: "Ability",
  splash: "Splash",
  lore: "Lore",
  quote: "Quote",
  emoji: "Emoji",
};

interface ModeTabsProps {
  active: QuizMode;
  /** Modes already finished today, marked so the day's progress is visible at a glance. */
  done: Partial<Record<QuizMode, "solved" | "failed">>;
  onSelect: (mode: QuizMode) => void;
}

export function ModeTabs({ active, done, onSelect }: ModeTabsProps): React.JSX.Element {
  return (
    <div role="tablist" aria-label="Quiz modes" className="flex flex-wrap gap-1.5">
      {QUIZ_MODES.map((mode) => {
        const state = done[mode];
        const isActive = mode === active;
        return (
          <button
            key={mode}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onSelect(mode)}
            className={`notch-sm flex items-center gap-1.5 border px-3 py-1.5 font-mono text-[11px] uppercase tracking-label transition-colors ${
              isActive
                ? "border-accent bg-accent/15 text-accent"
                : "border-line-2 bg-surface-dark text-fg-3 hover:text-fg-1"
            }`}
          >
            {MODE_LABELS[mode]}
            {state === "solved" && <span className="text-accent">✓</span>}
            {state === "failed" && <span className="text-fg-4">✕</span>}
          </button>
        );
      })}
    </div>
  );
}
