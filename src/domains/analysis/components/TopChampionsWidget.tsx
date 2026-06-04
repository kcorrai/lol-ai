"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface Props {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}

interface ChampionStat {
  name: string;
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

function computeChampionStats(matches: MatchPerformance[]): ChampionStat[] {
  const map = new Map<string, ChampionStat>();
  for (const m of matches) {
    const prev = map.get(m.champion) ?? { name: m.champion, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    map.set(m.champion, {
      ...prev,
      games: prev.games + 1,
      wins: prev.wins + (m.won ? 1 : 0),
      kills: prev.kills + m.kills,
      deaths: prev.deaths + m.deaths,
      assists: prev.assists + m.assists,
    });
  }
  return [...map.values()].sort((a, b) => b.games - a.games).slice(0, 3);
}

export function TopChampionsWidget({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2"><Skeleton className="h-4 w-28" /></CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) return null;

  const champions = computeChampionStats(matches);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Top Champions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {champions.map((c) => {
          const wr = Math.round((c.wins / c.games) * 100);
          const kda = ((c.kills + c.assists) / Math.max(c.deaths, 1)).toFixed(2);
          const wrColor = wr >= 55 ? "text-success" : wr >= 50 ? "text-warning" : "text-danger";
          return (
            <div key={c.name} className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2">
              <ChampionIcon name={c.name} size={40} className="shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text truncate">{c.name}</p>
                <p className="text-xs text-text-muted">{c.games} games · KDA {kda}</p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-sm font-bold ${wrColor}`}>{wr}%</p>
                <p className="text-xs text-text-muted">{c.wins}W {c.games - c.wins}L</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
