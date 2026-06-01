"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";

interface Props {
  profile: PlayerPerformanceProfile | undefined;
  isLoading: boolean;
}

function MetricCard({
  title,
  value,
  sub,
  highlight,
}: {
  title: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <Card>
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={`text-2xl font-display font-bold ${highlight ? "text-accent" : "text-text"}`}>
          {value}
        </p>
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

  const { avgMetrics, winRate, playstyle, gamesAnalyzed } = profile;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <MetricCard
        title="Win Rate"
        value={`${winRate}%`}
        sub={`${gamesAnalyzed} games`}
        highlight={winRate >= 55}
      />
      <MetricCard
        title="Avg KDA"
        value={avgMetrics.kda.toFixed(2)}
        sub={`${avgMetrics.avgDeathsPerGame.toFixed(1)} deaths/game`}
        highlight={avgMetrics.kda >= 3}
      />
      <MetricCard
        title="CS / min"
        value={avgMetrics.csPerMinute.toFixed(1)}
        sub={`${avgMetrics.avgGoldPerMinute.toFixed(0)} gold/min`}
      />
      <Card>
        <CardHeader className="pb-1">
          <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Playstyle
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="secondary" className="capitalize text-sm">
            {playstyle}
          </Badge>
          <p className="mt-1 text-xs text-text-muted">
            Strong: {profile.strongestArea}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
