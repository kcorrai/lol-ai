"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, Flame, Gamepad2, Monitor, Target, X } from "lucide-react";
import { useDailyQuest } from "@/hooks/useDailyQuest";
import type { QuestObjective } from "@/domains/analysis/services/dailyQuestService";

// Dismissal is remembered per quest day, not per session: hiding today's quest
// should survive a reload, and tomorrow's should still arrive on its own.
const DISMISS_KEY = "laneiq.dailyQuest.dismissed";

function hoursLeft(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "resetting";
  const hours = Math.floor(ms / 3_600_000);
  if (hours >= 1) return `${hours}h left`;
  return `${Math.max(1, Math.floor(ms / 60_000))}m left`;
}

export function DailyQuestStrip(): React.ReactElement | null {
  const { data, isLoading } = useDailyQuest();
  const [dismissedDay, setDismissedDay] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setDismissedDay(localStorage.getItem(DISMISS_KEY));
    setHydrated(true);
  }, []);

  function dismiss(): void {
    if (!data) return;
    localStorage.setItem(DISMISS_KEY, data.dateKey);
    setDismissedDay(data.dateKey);
  }

  // Rendered before hydration the strip would flash for someone who dismissed it.
  if (!hydrated || isLoading) {
    return isLoading ? (
      <div className="notch h-[104px] animate-pulse border border-border bg-surface" />
    ) : null;
  }
  // A quest that could not be loaded is not worth an error banner above the
  // readiness verdict — the dashboard's own states already speak for failures.
  if (!data || dismissedDay === data.dateKey) return null;

  return (
    <section className="notch border border-border bg-surface">
      <header className="flex items-center gap-3 border-b border-line-1 px-4 py-2.5">
        <Target className="h-3.5 w-3.5 text-accent" />
        <span className="hud-label">{"// Today's quest"}</span>
        <span className="ml-auto flex items-center gap-3">
          <span className="font-mono text-[11.5px] text-text-muted">
            {hoursLeft(data.expiresAt)}
          </span>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Hide today's quest"
            className="text-text-muted transition-colors hover:text-text"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </span>
      </header>

      <div className="grid grid-cols-1 gap-px bg-line-1 md:grid-cols-2">
        {data.objectives.map((objective) => (
          <ObjectiveCell key={`${objective.kind}-${objective.id}`} objective={objective} />
        ))}
      </div>

      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-line-1 px-4 py-2.5">
        <span className="flex items-center gap-1.5 text-[12.5px] text-text-body">
          <Flame
            className={`h-3.5 w-3.5 ${data.streak > 0 ? "text-warning" : "text-text-muted"}`}
          />
          {data.streak > 0
            ? `${data.streak} day quest streak`
            : "No streak yet — finish today's to start one"}
        </span>
        <span className="ml-auto font-mono text-[11.5px] text-text-muted">
          {data.completed ? "Quest complete" : `+${data.xpReward} XP on the line`}
        </span>
      </footer>
    </section>
  );
}

function ObjectiveCell({ objective }: { objective: QuestObjective }): React.ReactElement {
  const isInGame = objective.kind === "in_game";
  const Icon = isInGame ? Gamepad2 : Monitor;
  const pct = Math.round(objective.progress * 100);

  return (
    <div className="bg-surface px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2">
        <Icon className="h-3 w-3 text-text-muted" />
        <span className="hud-label">{isInGame ? "In game" : "On site"}</span>
        {objective.completed && (
          <span className="ml-auto flex items-center gap-1 text-[11px] font-semibold text-accent">
            <Check className="h-3 w-3" />
            Done
          </span>
        )}
      </div>

      <p
        className={`text-[13.5px] leading-snug ${objective.completed ? "text-text-muted line-through" : "text-text"}`}
      >
        {objective.title}
      </p>
      <p className="mt-0.5 text-[11.5px] leading-snug text-text-muted">{objective.hint}</p>

      <div className="mt-2.5 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-dark">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700"
            style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
          />
        </div>
        <span className="font-mono text-[11px] text-text-muted">+{objective.xpReward} XP</span>
        {!objective.completed && (
          <Link
            href={objective.href}
            className="whitespace-nowrap text-[11.5px] font-semibold text-accent hover:underline"
          >
            {objective.ctaLabel} →
          </Link>
        )}
      </div>
    </div>
  );
}
