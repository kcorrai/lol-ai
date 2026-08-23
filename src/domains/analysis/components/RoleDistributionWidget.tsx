"use client";

import Image from "next/image";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { roleIconUrl } from "@/lib/ddragon";
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
  TOP: "bg-warning",
  JUNGLE: "bg-accent",
  MIDDLE: "bg-info",
  BOTTOM: "bg-warning",
  UTILITY: "bg-accent",
};

function RoleIcon({ position }: { position: string }) {
  const [errored, setErrored] = useState(false);
  if (errored) {
    return <span className="text-xs font-bold text-text-muted">{position[0]}</span>;
  }
  return (
    <Image
      src={roleIconUrl(position)}
      alt={position}
      width={20}
      height={20}
      className="opacity-80"
      onError={() => setErrored(true)}
      unoptimized
    />
  );
}

export function RoleDistributionWidget({ matches, isLoading }: Props) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!matches || matches.length === 0) return null;

  const counts = new Map<string, { games: number; wins: number }>();
  for (const m of matches) {
    const prev = counts.get(m.position) ?? { games: 0, wins: 0 };
    counts.set(m.position, { games: prev.games + 1, wins: prev.wins + (m.won ? 1 : 0) });
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
      <CardContent className="space-y-2.5">
        {sorted.map(([role, { games, wins }]) => {
          const pct = Math.round((games / total) * 100);
          const wr = Math.round((wins / games) * 100);
          const label = ROLE_LABELS[role] ?? role;
          const color = ROLE_COLORS[role] ?? "bg-accent";
          const wrColor = wr >= 55 ? "text-success" : wr >= 50 ? "text-warning" : "text-danger";
          return (
            <div key={role} className="flex items-center gap-2.5 text-xs">
              <div className="flex w-6 shrink-0 items-center justify-center">
                <RoleIcon position={role} />
              </div>
              <span className="w-12 shrink-0 font-medium text-text">{label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${color} opacity-80`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <span className="w-7 shrink-0 text-right text-text-muted">{pct}%</span>
              <span className={`w-12 shrink-0 text-right font-semibold ${wrColor}`}>{wr}% WR</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
