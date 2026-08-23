"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";

interface Props {
  profile: PlayerPerformanceProfile | undefined;
  isLoading: boolean;
}

function DeltaBadge({ delta, threshold = 0.1 }: { delta: number; threshold?: number }) {
  if (Math.abs(delta) < threshold) return null;
  const positive = delta > 0;
  return (
    <span className={`ml-1.5 text-xs font-medium ${positive ? "text-success" : "text-danger"}`}>
      {positive ? "↑" : "↓"} {positive ? "+" : ""}
      {delta}
    </span>
  );
}

function MetricCard({
  title,
  value,
  sub,
  highlight,
  delta,
  deltaThreshold,
}: {
  title: string;
  value: string;
  sub?: string;
  highlight?: boolean;
  delta?: number;
  deltaThreshold?: number;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline">
          <p
            className={`font-display text-2xl font-bold ${highlight ? "text-accent" : "text-text"}`}
          >
            {value}
          </p>
          {delta !== undefined && <DeltaBadge delta={delta} threshold={deltaThreshold} />}
        </div>
        {sub && <p className="mt-0.5 text-xs text-text-muted">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function PerformanceSummaryCards({ profile, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-1">
              <Skeleton className="h-3 w-20" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!profile) return null;

  const { avgMetrics, winRate, playstyle, gamesAnalyzed, delta } = profile;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard
        title="Win Rate"
        value={`${winRate}%`}
        sub={`${gamesAnalyzed} games`}
        highlight={winRate >= 55}
        delta={delta?.winRate}
        deltaThreshold={1}
      />
      <MetricCard
        title="Avg KDA"
        value={avgMetrics.kda.toFixed(2)}
        sub={`${avgMetrics.avgDeathsPerGame.toFixed(1)} deaths/game`}
        highlight={avgMetrics.kda >= 3}
        delta={delta?.kda}
        deltaThreshold={0.1}
      />
      <MetricCard
        title="CS / min"
        value={avgMetrics.csPerMinute.toFixed(1)}
        sub={`${avgMetrics.avgGoldPerMinute.toFixed(0)} gold/min`}
        delta={delta?.csPerMinute}
        deltaThreshold={0.2}
      />
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Playstyle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="text-sm capitalize">
            {playstyle}
          </Badge>
          <p className="mt-1 text-xs text-text-muted">Strong: {profile.strongestArea}</p>
        </CardContent>
      </Card>
    </div>
  );
}
