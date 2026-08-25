"use client";

import { Flame, Star } from "lucide-react";
import { useChallenges } from "@/hooks/useChallenges";
import { formatCount } from "@/lib/uiLocale";

const XP_PER_LEVEL = 500;

// Clash-Royale-style progression header: the player's own level, XP bar and daily streak — the
// gamified surface the coach tour spotlights. Data comes from useChallenges() (no new API).
export function ProgressionStrip({
  summonerLevel,
  isPro,
}: {
  summonerLevel?: number;
  isPro?: boolean;
}): React.JSX.Element {
  const { data, isLoading } = useChallenges();

  if (isLoading) {
    return (
      <div
        className="h-16 animate-pulse rounded-2xl border border-border bg-surface"
        data-tour="progression"
      />
    );
  }

  const level = data?.level ?? 1;
  const xp = data?.xp ?? 0;
  const xpToNext = data?.xpToNext ?? XP_PER_LEVEL;
  const streak = data?.streak ?? 0;
  const pct = Math.round(((XP_PER_LEVEL - xpToNext) / XP_PER_LEVEL) * 100);

  return (
    <div
      data-tour="progression"
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4"
    >
      {/* Level badge */}
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-accent/15 ring-1 ring-accent/40">
          <Star className="h-5 w-5 text-accent" />
          <span className="absolute -bottom-1 -right-1 rounded-md bg-surface px-1.5 text-[11px] font-bold text-accent ring-1 ring-accent/40">
            {level}
          </span>
        </div>
        <div>
          <p className="text-sm font-bold text-text">Level {level}</p>
          <p className="text-[11px] text-text-muted">{formatCount(xp)} total XP</p>
        </div>
      </div>

      {/* XP progress toward next level */}
      <div className="min-w-[180px] flex-1">
        <div className="mb-1 flex items-center justify-between text-[11px] text-text-muted">
          <span>Progress</span>
          <span>
            {xpToNext} XP → Level {level + 1}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-accent transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* Streak + meta chips */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-lg border border-warning/30 bg-warning/10 px-2.5 py-1.5 text-xs font-semibold text-warning">
          <Flame className="h-3.5 w-3.5" /> {streak} day streak
        </span>
        {summonerLevel !== undefined && (
          <span className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-xs font-medium text-text-muted">
            Summoner {summonerLevel}
          </span>
        )}
        <span
          className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${isPro ? "bg-success/15 text-success" : "bg-surface-2 text-text-muted"}`}
        >
          {isPro ? "Pro" : "Free"}
        </span>
      </div>
    </div>
  );
}
