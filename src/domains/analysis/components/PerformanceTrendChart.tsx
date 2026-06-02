"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface Props {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}

type Metric = "kda" | "csPerMinute";

function computeKDA(m: MatchPerformance): number {
  return (m.kills + m.assists) / Math.max(m.deaths, 1);
}

function Bar({
  value,
  maxValue,
  won,
  label,
}: {
  value: number;
  maxValue: number;
  won: boolean;
  label: string;
}) {
  const pct = Math.max(4, (value / maxValue) * 100);
  return (
    <div
      className="group relative flex h-full flex-1 flex-col items-center justify-end"
      title={label}
    >
      <div
        className={`w-full rounded-t transition-all ${won ? "bg-success" : "bg-danger"} opacity-80 group-hover:opacity-100`}
        style={{ height: `${pct}%` }}
      />
    </div>
  );
}

function TrendBars({ matches, metric }: { matches: MatchPerformance[]; metric: Metric }) {
  const slice = [...matches].reverse().slice(0, 10);
  const values = slice.map((m) => (metric === "kda" ? computeKDA(m) : m.csPerMinute));
  const max = Math.max(...values, 0.1);

  return (
    <div className="flex h-16 items-end gap-0.5">
      {slice.map((m, i) => (
        <Bar
          key={m.riotMatchId}
          value={values[i]}
          maxValue={max}
          won={m.won}
          label={`${m.champion} — ${metric === "kda" ? `KDA ${values[i].toFixed(2)}` : `${values[i].toFixed(1)} CS/min`}`}
        />
      ))}
    </div>
  );
}

export function PerformanceTrendChart({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-text-muted">
          Last {Math.min(matches.length, 10)} Games — green = win, red = loss
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-1 text-xs text-text-muted">KDA</p>
          <TrendBars matches={matches} metric="kda" />
        </div>
        <div>
          <p className="mb-1 text-xs text-text-muted">CS / min</p>
          <TrendBars matches={matches} metric="csPerMinute" />
        </div>
      </CardContent>
    </Card>
  );
}
