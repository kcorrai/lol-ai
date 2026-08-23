"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface Props {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}

function computeStreak(matches: MatchPerformance[]): { type: "W" | "L"; count: number } | null {
  if (matches.length === 0) return null;
  const first = matches[0].won;
  let count = 0;
  for (const m of matches) {
    if (m.won === first) count++;
    else break;
  }
  return count >= 2 ? { type: first ? "W" : "L", count } : null;
}

function WinRateBar({ label, wins, total }: { label: string; wins: number; total: number }) {
  const pct = total > 0 ? Math.round((wins / total) * 100) : 0;
  const color = pct >= 55 ? "bg-success" : pct >= 50 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-20 shrink-0 text-text-muted">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span
        className={`w-8 text-right font-medium ${pct >= 55 ? "text-success" : pct >= 50 ? "text-warning" : "text-danger"}`}
      >
        {pct}%
      </span>
    </div>
  );
}

export function WinrateTrendWidget({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length < 5) return null;

  // Most recent first; cap at 20
  const recent = matches.slice(0, 20);
  const totalWins = recent.filter((m) => m.won).length;
  const totalWr = Math.round((totalWins / recent.length) * 100);
  const streak = computeStreak(recent);

  // 5-game buckets (most recent = bucket 1)
  const buckets: Array<{ label: string; wins: number; total: number }> = [];
  for (let i = 0; i < Math.min(recent.length, 20); i += 5) {
    const slice = recent.slice(i, i + 5);
    if (slice.length < 3) break;
    buckets.push({
      label: `Games ${i + 1}–${i + slice.length}`,
      wins: slice.filter((m) => m.won).length,
      total: slice.length,
    });
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Win/Loss Trend
          </CardTitle>
          <div className="flex items-center gap-2">
            {streak && (
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-semibold ${streak.type === "W" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}
              >
                {streak.count}
                {streak.type} streak
              </span>
            )}
            <span
              className={`text-sm font-bold ${totalWr >= 55 ? "text-success" : totalWr >= 50 ? "text-warning" : "text-danger"}`}
            >
              {totalWr}% WR
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* W/L dots */}
        <div className="flex flex-wrap gap-1">
          {recent.map((m, i) => (
            <div
              key={m.riotMatchId}
              title={`${m.champion} — ${m.won ? "Win" : "Loss"}`}
              className={`h-4 w-4 rounded-sm ${m.won ? "bg-success" : "bg-danger"} opacity-80 hover:opacity-100`}
              style={{ order: i }}
            />
          ))}
        </div>
        {/* Per-bucket win rates */}
        <div className="space-y-1.5">
          {buckets.map((b) => (
            <WinRateBar key={b.label} {...b} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
