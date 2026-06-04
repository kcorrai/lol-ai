"use client";

import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionFocusButton } from "@/domains/champions/components/ChampionFocusButton";
import type { ChampionPoolEntry } from "@/domains/champions/services/championStatsService";

function winRateVariant(wr: number): "success" | "warning" | "destructive" {
  if (wr >= 55) return "success";
  if (wr >= 50) return "warning";
  return "destructive";
}

function ChampionCard({ entry, riotAccountId }: { entry: ChampionPoolEntry; riotAccountId?: string }) {
  return (
    <div
      className={`relative rounded-lg border bg-surface-2 p-4 transition-colors ${
        entry.isBest
          ? "border-accent/50 ring-1 ring-accent/20"
          : "border-border hover:border-border/80"
      }`}
    >
      {entry.isBest && (
        <span className="absolute -top-2.5 left-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
          Best Pick
        </span>
      )}

      <div className="flex items-center gap-3">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface">
          {entry.imageUrl ? (
            <Image
              src={entry.imageUrl}
              alt={entry.championName}
              width={48}
              height={48}
              className="object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center text-lg font-bold text-text-muted">
              {entry.championName[0]}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-display text-sm font-semibold text-text">
              {entry.championName}
            </p>
            <Badge variant={winRateVariant(entry.winRate)}>
              {entry.winRate}% WR
            </Badge>
          </div>
          <div className="mt-1 flex gap-3 text-xs text-text-muted">
            <span>{entry.gamesPlayed}G</span>
            <span>KDA {entry.avgKda}</span>
            <span>{entry.avgCsPerMinute} CS/m</span>
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {entry.wins}W {entry.gamesPlayed - entry.wins}L
          </div>
        </div>
      </div>
      {riotAccountId && (
        <ChampionFocusButton riotAccountId={riotAccountId} championName={entry.championName} />
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-lg" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-3 w-36" />
        </div>
      </div>
    </div>
  );
}

interface Props {
  entries: ChampionPoolEntry[];
  isLoading: boolean;
  riotAccountId?: string;
}

export function ChampionPoolGrid({ entries, isLoading, riotAccountId }: Props) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-surface-2 py-14 text-center">
        <p className="text-sm font-medium text-text">Not enough data yet</p>
        <p className="mt-1 text-xs text-text-muted">
          Play at least 3 ranked games on a champion for it to appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <ChampionCard key={entry.championId} entry={entry} riotAccountId={riotAccountId} />
      ))}
    </div>
  );
}
