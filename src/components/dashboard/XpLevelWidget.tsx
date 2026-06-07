"use client";

import { useChallenges } from "@/hooks/useChallenges";

const XP_PER_LEVEL = 500;

export function XpLevelWidget() {
  const { data, isLoading } = useChallenges();

  if (isLoading) {
    return <div className="animate-pulse rounded-xl border border-border bg-surface p-4 h-20" />;
  }

  const xp = data?.xp ?? 0;
  const level = data?.level ?? 1;
  const xpToNext = data?.xpToNext ?? XP_PER_LEVEL;
  const xpInLevel = XP_PER_LEVEL - xpToNext;
  const pct = Math.round((xpInLevel / XP_PER_LEVEL) * 100);

  return (
    <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text">Seviye {level}</span>
        <span className="text-xs text-text-muted">{xpToNext} XP → Seviye {level + 1}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[11px] text-text-muted">{xp} toplam XP</p>
    </div>
  );
}
