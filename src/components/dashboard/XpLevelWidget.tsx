"use client";

import { Flame } from "lucide-react";
import { useChallenges } from "@/hooks/useChallenges";

const XP_PER_LEVEL = 500;

export function XpLevelWidget() {
  const { data, isLoading } = useChallenges();

  if (isLoading) {
    return <div className="h-20 animate-pulse rounded-xl border border-border bg-surface p-4" />;
  }

  const xp = data?.xp ?? 0;
  const level = data?.level ?? 1;
  const xpToNext = data?.xpToNext ?? XP_PER_LEVEL;
  const streak = data?.streak ?? 0;
  const xpInLevel = XP_PER_LEVEL - xpToNext;
  const pct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  return (
    <div className="space-y-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">Level {level}</span>
        {streak > 0 && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning">
            <Flame className="h-3.5 w-3.5" /> {streak} day streak
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-text-muted">
        {xpToNext} XP → Level {level + 1} · {xp.toLocaleString()} total XP
      </p>
    </div>
  );
}
