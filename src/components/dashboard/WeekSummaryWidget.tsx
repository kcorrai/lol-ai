"use client";

import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface Props {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}

function getWeekBounds(weeksAgo = 0): { start: Date; end: Date } {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7) - weeksAgo * 7);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 7);
  return { start: monday, end: sunday };
}

function winRate(matches: MatchPerformance[]): number {
  if (matches.length === 0) return 0;
  return Math.round((matches.filter((m) => m.won).length / matches.length) * 100);
}

function avgKda(matches: MatchPerformance[]): string {
  if (matches.length === 0) return "—";
  const kda =
    matches.reduce((s, m) => s + (m.kills + m.assists) / Math.max(m.deaths, 1), 0) / matches.length;
  return kda.toFixed(2);
}

function topChampion(matches: MatchPerformance[]): string | null {
  if (matches.length === 0) return null;
  const counts: Record<string, number> = {};
  for (const m of matches) counts[m.champion] = (counts[m.champion] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
}

function estimatedHours(matches: MatchPerformance[]): number {
  const totalMins = matches.reduce((s, m) => s + m.gameDurationMinutes, 0);
  return Math.round((totalMins / 60) * 10) / 10;
}

function Stat({ label, value, sub }: { label: string; value: React.ReactNode; sub?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted/60">
        {label}
      </span>
      <span className="mt-0.5 text-lg font-bold leading-none text-text">{value}</span>
      {sub && <span className="mt-0.5 text-[10px] text-text-muted">{sub}</span>}
    </div>
  );
}

function WrTrend({ current, prev }: { current: number; prev: number }) {
  const diff = current - prev;
  if (prev === 0) return null;
  if (Math.abs(diff) < 2)
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
        <Minus className="h-3 w-3" /> Stable
      </span>
    );
  if (diff > 0)
    return (
      <span className="flex items-center gap-0.5 text-[10px] text-success">
        <TrendingUp className="h-3 w-3" /> +{diff}pp vs last week
      </span>
    );
  return (
    <span className="flex items-center gap-0.5 text-[10px] text-danger">
      <TrendingDown className="h-3 w-3" /> {diff}pp vs last week
    </span>
  );
}

export function WeekSummaryWidget({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-3 w-28" />
        <div className="grid grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!matches || matches.length === 0) return null;

  const thisWeek = getWeekBounds(0);
  const lastWeek = getWeekBounds(1);

  const thisWeekMatches = matches.filter((m) => {
    const d = new Date(m.gameStart);
    return d >= thisWeek.start && d < thisWeek.end;
  });

  const lastWeekMatches = matches.filter((m) => {
    const d = new Date(m.gameStart);
    return d >= lastWeek.start && d < lastWeek.end;
  });

  if (thisWeekMatches.length === 0) return null;

  const wr = winRate(thisWeekMatches);
  const prevWr = winRate(lastWeekMatches);
  const kda = avgKda(thisWeekMatches);
  const champ = topChampion(thisWeekMatches);
  const hours = estimatedHours(thisWeekMatches);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted/60">
          This Week
        </p>
        <WrTrend current={wr} prev={prevWr} />
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Stat
          label="Matches"
          value={thisWeekMatches.length}
          sub={`${thisWeekMatches.filter((m) => m.won).length}W ${thisWeekMatches.filter((m) => !m.won).length}L`}
        />
        <Stat
          label="Win Rate"
          value={
            <span className={wr >= 55 ? "text-success" : wr < 45 ? "text-danger" : "text-text"}>
              {wr}%
            </span>
          }
        />
        <Stat label="KDA" value={kda} />
        <Stat label="Time" value={`${hours}h`} sub="total" />
      </div>

      {champ && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border/60 bg-surface-2 px-3 py-2">
          <ChampionIcon name={champ} size={28} />
          <div>
            <p className="text-xs font-semibold text-text">{champ}</p>
            <p className="text-[10px] text-text-muted">This week&apos;s champion</p>
          </div>
        </div>
      )}
    </div>
  );
}
