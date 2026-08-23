"use client";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { ChampionFocusButton } from "@/domains/champions/components/ChampionFocusButton";
import { CounterPickCard } from "@/domains/champions/components/CounterPickCard";
import { championLoadingUrl } from "@/lib/ddragon";
import type { ChampionPoolEntry } from "@/domains/champions/services/championStatsService";
import { cn } from "@/lib/utils";

function masteryColor(score: number): string {
  if (score >= 75) return "bg-accent";
  if (score >= 50) return "bg-info";
  if (score >= 30) return "bg-warning";
  return "bg-text-muted/40";
}

function MasteryBar({ entry }: { entry: ChampionPoolEntry }) {
  const { masteryScore, masterySubScores } = entry;
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-text-muted/60">
          Mastery
        </span>
        <span
          className={cn(
            "text-xs font-bold",
            masteryScore >= 75 ? "text-accent" : "text-text-muted"
          )}
          title={`Experience: ${masterySubScores.experience} · Performance: ${masterySubScores.performance} · CS: ${masterySubScores.farm}`}
        >
          {masteryScore}/100
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface">
        <div
          className={cn("h-full rounded-full transition-all", masteryColor(masteryScore))}
          style={{ width: `${masteryScore}%` }}
        />
      </div>
    </div>
  );
}

function winRateVariant(wr: number): "success" | "warning" | "destructive" {
  if (wr >= 55) return "success";
  if (wr >= 50) return "warning";
  return "destructive";
}

function ChampionCard({
  entry,
  riotAccountId,
  onDeepDive,
}: {
  entry: ChampionPoolEntry;
  riotAccountId?: string;
  onDeepDive?: (name: string) => void;
}) {
  const splashUrl = championLoadingUrl(entry.championName);
  const glowColor = entry.isBest ? "rgba(198,255,61,0.18)" : "rgba(46,67,64,0.45)";

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-surface-2 p-4 transition-all duration-200 ${
        entry.isBest
          ? "border-accent/50 ring-1 ring-accent/20"
          : "border-border hover:border-accent/25"
      }`}
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow =
          `0 0 24px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.04)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.03)";
      }}
    >
      {/* Champion art bg */}
      <div
        className="pointer-events-none absolute right-0 top-0 h-full w-36 opacity-[0.07] transition-opacity duration-300 group-hover:opacity-[0.12]"
        style={{
          backgroundImage: `url(${splashUrl})`,
          backgroundSize: "cover",
          backgroundPosition: "top center",
          maskImage: "linear-gradient(to left, rgba(0,0,0,0.8) 0%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,0.8) 0%, transparent 100%)",
        }}
      />

      {entry.isBest && (
        <span className="absolute -top-2.5 left-3 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-background">
          Best Pick
        </span>
      )}

      <div className="relative flex items-center gap-3">
        <ChampionIcon name={entry.championName} size={48} className="shrink-0" />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-display text-sm font-semibold text-text">
              {entry.championName}
            </p>
            <Badge variant={winRateVariant(entry.winRate)}>{entry.winRate}% WR</Badge>
          </div>
          <div className="mt-1 flex gap-3 text-xs text-text-muted">
            <span>{entry.gamesPlayed} games</span>
            <span>KDA {entry.avgKda}</span>
            <span>{entry.avgCsPerMinute} CS/min</span>
          </div>
          <div className="mt-1 text-xs text-text-muted">
            {entry.wins}W {entry.gamesPlayed - entry.wins}L
          </div>
        </div>
      </div>

      <MasteryBar entry={entry} />

      {riotAccountId && (
        <>
          <div className="relative mt-3 flex items-center gap-2">
            {onDeepDive && (
              <button
                onClick={() => onDeepDive(entry.championName)}
                className="flex-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-text-muted transition-colors hover:border-accent/50 hover:text-accent"
              >
                Deep Dive
              </button>
            )}
            <ChampionFocusButton riotAccountId={riotAccountId} championName={entry.championName} />
          </div>
          <CounterPickCard riotAccountId={riotAccountId} championName={entry.championName} />
        </>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-border bg-surface-2 p-4">
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
  onDeepDive?: (championName: string) => void;
}

export function ChampionPoolGrid({ entries, isLoading, riotAccountId, onDeepDive }: Props) {
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
      <div className="rounded-xl border border-dashed border-border bg-surface-2/50 py-14 text-center">
        <p className="text-sm font-medium text-text">Not enough data yet</p>
        <p className="mt-1 text-xs text-text-muted">
          Play at least 3 ranked matches with a champion to see it appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map((entry) => (
        <ChampionCard
          key={entry.championId}
          entry={entry}
          riotAccountId={riotAccountId}
          onDeepDive={onDeepDive}
        />
      ))}
    </div>
  );
}
