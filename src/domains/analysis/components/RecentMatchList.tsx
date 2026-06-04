"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ItemIcon } from "@/components/ui/ItemIcon";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface Props {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}

const ROLE_SHORT: Record<string, string> = {
  TOP: "Top", JUNGLE: "Jgl", MIDDLE: "Mid", BOTTOM: "Bot", UTILITY: "Sup",
};

function MatchRow({ match }: { match: MatchPerformance }) {
  const kda = ((match.kills + match.assists) / Math.max(match.deaths, 1)).toFixed(2);
  const kdaColor = Number(kda) >= 4 ? "text-success" : Number(kda) >= 2 ? "text-warning" : "text-text-muted";

  return (
    <Link
      href={`/match/${match.matchDbId}`}
      className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors hover:bg-surface-2/60 ${
        match.won ? "border-success/20 bg-success/5" : "border-danger/20 bg-danger/5"
      }`}
    >
      {/* W/L bar */}
      <div className={`h-12 w-1 shrink-0 rounded-full ${match.won ? "bg-success" : "bg-danger"}`} />

      {/* Champion */}
      <ChampionIcon name={match.champion} size={48} className="shrink-0" />

      {/* Name + role + result */}
      <div className="w-28 shrink-0">
        <p className="text-sm font-semibold text-text">{match.champion}</p>
        <p className="text-xs text-text-muted">{ROLE_SHORT[match.position] ?? match.position}</p>
        <Badge variant={match.won ? "success" : "destructive"} className="mt-0.5 text-[10px]">
          {match.won ? "Victory" : "Defeat"}
        </Badge>
      </div>

      {/* KDA */}
      <div className="w-24 shrink-0 text-center">
        <p className="text-sm font-semibold text-text">
          {match.kills}/<span className="text-danger">{match.deaths}</span>/{match.assists}
        </p>
        <p className={`text-xs font-medium ${kdaColor}`}>{kda} KDA</p>
      </div>

      {/* Stats */}
      <div className="hidden w-28 shrink-0 text-xs text-text-muted sm:block">
        <p>{match.csPerMinute.toFixed(1)} CS/min</p>
        <p>{match.visionScore} vision</p>
        <p>{match.gameDurationMinutes} min</p>
      </div>

      {/* Items */}
      {match.itemIds?.length > 0 && (
        <div className="hidden flex-1 flex-wrap gap-0.5 lg:flex">
          {match.itemIds.slice(0, 6).map((id, i) => (
            <ItemIcon key={i} itemId={id} size={24} />
          ))}
        </div>
      )}
    </Link>
  );
}

export function RecentMatchList({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return <p className="text-sm text-text-muted">No recent matches found.</p>;
  }

  return (
    <div className="space-y-2">
      {matches.slice(0, 10).map((m) => (
        <MatchRow key={m.riotMatchId} match={m} />
      ))}
    </div>
  );
}
