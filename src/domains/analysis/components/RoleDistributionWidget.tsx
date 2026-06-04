"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

interface Props {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
};

const ROLE_COLORS: Record<string, string> = {
  TOP: "bg-orange-500",
  JUNGLE: "bg-green-600",
  MIDDLE: "bg-blue-500",
  BOTTOM: "bg-yellow-500",
  UTILITY: "bg-purple-500",
};

export function RoleDistributionWidget({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-4 w-32" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) return null;

  // Count games + wins per role
  const counts = new Map<string, { games: number; wins: number }>();
  for (const m of matches) {
    const role = m.position;
    const prev = counts.get(role) ?? { games: 0, wins: 0 };
    counts.set(role, { games: prev.games + 1, wins: prev.wins + (m.won ? 1 : 0) });
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1].games - a[1].games);
  const total = matches.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Role Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {sorted.map(([role, { games, wins }]) => {
          const pct = Math.round((games / total) * 100);
          const wr = Math.round((wins / games) * 100);
          const label = ROLE_LABELS[role] ?? role;
          const color = ROLE_COLORS[role] ?? "bg-accent";
          return (
            <div key={role} className="flex items-center gap-2 text-xs">
              <span className="w-14 shrink-0 font-medium text-text">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div className={`h-full rounded-full ${color} opacity-80`} style={{ width: `${pct}%` }} />
              </div>
              <span className="w-8 shrink-0 text-right text-text-muted">{pct}%</span>
              <span className="w-10 shrink-0 text-right text-text-muted">{games}G</span>
              <span className={`w-10 shrink-0 text-right font-medium ${wr >= 55 ? "text-success" : wr >= 50 ? "text-warning" : "text-danger"}`}>
                {wr}%WR
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
