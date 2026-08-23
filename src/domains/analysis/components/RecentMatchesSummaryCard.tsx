"use client";

import { CheckCircle2, Zap } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type {
  PlayerPerformanceProfile,
  PlaystyleType,
} from "@/domains/analysis/types/analysis.types";

const PLAYSTYLE_LABELS: Record<PlaystyleType, string> = {
  aggressive: "Aggressive",
  farming: "Farming",
  supportive: "Supportive",
  balanced: "Balanced",
  passive: "Passive",
};

const PLAYSTYLE_STYLES: Record<PlaystyleType, string> = {
  aggressive: "bg-danger/15 text-danger",
  farming: "bg-accent/15 text-accent",
  supportive: "bg-info/15 text-info",
  balanced: "bg-border/40 text-text-muted",
  passive: "bg-warning/15 text-warning",
};

interface RecentMatchesSummaryCardProps {
  profile: PlayerPerformanceProfile | undefined;
  isLoading: boolean;
}

export function RecentMatchesSummaryCard({ profile, isLoading }: RecentMatchesSummaryCardProps) {
  if (isLoading) {
    return (
      <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
        <Skeleton className="h-3 w-40" />
        <div className="flex gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-6 w-10" />
            </div>
          ))}
        </div>
        <Skeleton className="h-4 w-36" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
    );
  }

  if (!profile || profile.gamesAnalyzed === 0) return null;

  const topChampion = profile.mostPlayedChampions[0];
  const kda = profile.avgMetrics.kda.toFixed(1);
  const cs = profile.avgMetrics.csPerMinute.toFixed(1);
  const wr = Math.round(profile.winRate);

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
        Last {profile.gamesAnalyzed} Matches Performance
      </p>

      <div className="mb-4 grid grid-cols-3 gap-4">
        <StatItem label="KDA" value={kda} />
        <StatItem label="CS/dk" value={cs} />
        <StatItem label="Win Rate" value={`${wr}%`} highlight={wr >= 50} />
      </div>

      {topChampion && (
        <div className="mb-3 flex items-center gap-2">
          <ChampionIcon name={topChampion} size={28} />
          <span className="text-sm font-medium text-text">{topChampion}</span>
          <span className="text-text-muted">•</span>
          <span
            className={cn(
              "rounded px-2 py-0.5 text-xs font-medium",
              PLAYSTYLE_STYLES[profile.playstyle]
            )}
          >
            {PLAYSTYLE_LABELS[profile.playstyle]}
          </span>
        </div>
      )}

      <div className="space-y-1.5">
        <div className="flex items-start gap-1.5 text-sm">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
          <span className="text-text-muted">
            Strength: <span className="text-text">{profile.strongestArea}</span>
          </span>
        </div>
        <div className="flex items-start gap-1.5 text-sm">
          <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
          <span className="text-text-muted">
            Growth Area: <span className="text-text">{profile.weakestArea}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function StatItem({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface-2 px-4 py-3">
      <p className="mb-1 text-xs text-text-muted">{label}</p>
      <p className={cn("text-2xl font-bold", highlight ? "text-accent" : "text-text")}>{value}</p>
    </div>
  );
}
