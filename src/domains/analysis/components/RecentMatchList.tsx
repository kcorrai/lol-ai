"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface Props {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}

function MatchRow({ match }: { match: MatchPerformance }) {
  const kda = ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2);
  return (
    <Link
      href={`/match/${match.matchDbId}`}
      className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2 transition-colors hover:bg-surface-2/80 hover:ring-1 hover:ring-border"
    >
      <div
        className={`h-full w-1 self-stretch rounded-full ${match.won ? "bg-success" : "bg-danger"}`}
      />
      <ChampionIcon name={match.champion} size={36} className="shrink-0" />
      <div className="min-w-[80px]">
        <p className="text-sm font-medium text-text">{match.champion}</p>
        <p className="text-xs text-text-muted">{match.position}</p>
      </div>
      <div className="flex flex-1 gap-4 text-xs text-text-muted">
        <span>
          <span className="font-medium text-text">{match.kills}</span>/
          <span className="text-danger">{match.deaths}</span>/
          <span className="font-medium text-text">{match.assists}</span>
          <span className="ml-1 text-text-muted">({kda})</span>
        </span>
        <span>{match.csPerMinute.toFixed(1)} CS/min</span>
        <span>{match.gameDurationMinutes} min</span>
      </div>
      <Badge variant={match.won ? "success" : "destructive"} className="text-xs">
        {match.won ? "W" : "L"}
      </Badge>
    </Link>
  );
}

export function RecentMatchList({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return <p className="text-sm text-text-muted">No recent matches found.</p>;
  }

  return (
    <div className="space-y-1.5">
      {matches.slice(0, 10).map((m) => (
        <MatchRow key={m.riotMatchId} match={m} />
      ))}
    </div>
  );
}
