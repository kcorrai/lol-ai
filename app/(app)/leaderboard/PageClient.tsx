"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Trophy, TrendingUp, TrendingDown } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { rankEmblemUrl, profileIconUrl } from "@/lib/ddragon";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/domains/analysis/services/leaderboardService";

const TIER_COLORS: Record<string, string> = {
  IRON: "text-gray-400", BRONZE: "text-amber-700", SILVER: "text-gray-300",
  GOLD: "text-yellow-400", PLATINUM: "text-teal-400", EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400", MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400", CHALLENGER: "text-yellow-300",
};

const RANK_MEDALS = ["🥇", "🥈", "🥉"];

function RankNumber({ rank }: { rank: number }) {
  if (rank <= 3) {
    return <span className="text-lg">{RANK_MEDALS[rank - 1]}</span>;
  }
  return <span className="w-7 text-center text-sm font-bold text-text-muted">{rank}</span>;
}

function LpChange({ lp }: { lp: number }) {
  if (lp > 0) return (
    <span className="flex items-center gap-0.5 text-sm font-bold text-success">
      <TrendingUp className="h-3.5 w-3.5" />+{lp}
    </span>
  );
  if (lp < 0) return (
    <span className="flex items-center gap-0.5 text-sm font-bold text-danger">
      <TrendingDown className="h-3.5 w-3.5" />{lp}
    </span>
  );
  return <span className="text-sm text-text-muted">±0</span>;
}

function PlayerRow({ entry, index: _index }: { entry: LeaderboardEntry; index: number }) {
  const iconUrl = entry.profileIconId ? profileIconUrl(entry.profileIconId) : null;
  const emblemUrl = rankEmblemUrl(entry.currentTier);
  const tierColor = TIER_COLORS[entry.currentTier] ?? "text-text-muted";
  const isTop3 = entry.rank <= 3;

  return (
    <Link
      href={`/u/${entry.profileSlug}`}
      className={cn(
        "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-150",
        "hover:border-accent/30 hover:bg-accent/5",
        isTop3 ? "border-accent/20 bg-accent/5" : "border-border bg-surface"
      )}
      style={isTop3 ? { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)" } : undefined}
    >
      {/* Rank */}
      <div className="flex w-8 shrink-0 items-center justify-center">
        <RankNumber rank={entry.rank} />
      </div>

      {/* Avatar */}
      <div className="shrink-0">
        {iconUrl ? (
          <Image src={iconUrl} alt={entry.displayName} width={36} height={36} unoptimized
            className="rounded-full border border-border" />
        ) : (
          <div className="h-9 w-9 rounded-full border border-border bg-surface-2" />
        )}
      </div>

      {/* Name + rank */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-text group-hover:text-accent">
          {entry.displayName}
        </p>
        <div className="mt-0.5 flex items-center gap-1.5">
          {emblemUrl && (
            <Image src={emblemUrl} alt={entry.currentTier} width={16} height={16} unoptimized />
          )}
          <span className={`text-xs font-medium ${tierColor}`}>
            {entry.currentTier.charAt(0)}{entry.currentTier.slice(1).toLowerCase()}{" "}
            {["MASTER", "GRANDMASTER", "CHALLENGER"].includes(entry.currentTier) ? "" : entry.currentDivision}
            {" · "}{entry.currentLp} LP
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="hidden shrink-0 items-center gap-6 sm:flex">
        <div className="text-right">
          <p className="text-xs text-text-muted">Matches</p>
          <p className="text-sm font-semibold text-text">
            <span className="text-success">{entry.wins}W</span>
            <span className="text-text-muted"> {entry.losses}L</span>
          </p>
        </div>
        <div className="w-14 text-right">
          <p className="text-xs text-text-muted">WR</p>
          <p className={cn("text-sm font-bold", entry.winRate >= 55 ? "text-success" : entry.winRate < 45 ? "text-danger" : "text-text")}>
            %{entry.winRate}
          </p>
        </div>
      </div>

      {/* LP gained */}
      <div className="w-16 shrink-0 text-right">
        <p className="text-[10px] text-text-muted">LP</p>
        <LpChange lp={entry.lpGained} />
      </div>
    </Link>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
          <Skeleton className="h-5 w-8 rounded" />
          <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

type Period = "week" | "month";

export default function LeaderboardPage() {
  const [period, setPeriod] = useState<Period>("week");
  const { data, isLoading } = useLeaderboard(period);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <PageHeader
        title="Leaderboard"
        subtitle="Fastest climbers on the platform — public profiles only"
        action={<Trophy className="h-5 w-5 text-accent" />}
      />

      {/* Period tabs */}
      <div className="flex gap-1 rounded-lg border border-border bg-surface-2 p-1 w-fit">
        {(["week", "month"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={cn(
              "rounded-md px-4 py-1.5 text-sm font-medium transition-colors",
              period === p ? "bg-surface text-text shadow-sm" : "text-text-muted hover:text-text"
            )}
          >
            {p === "week" ? "This Week" : "This Month"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <SkeletonRows />
      ) : !data || data.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
          <p className="text-sm font-medium text-text">Not enough data yet</p>
          <p className="mt-1 text-xs text-text-muted">
            Only players who&apos;ve played at least 3 matches and have public profiles are shown.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.map((entry, i) => (
            <PlayerRow key={entry.profileSlug} entry={entry} index={i} />
          ))}
        </div>
      )}

      <p className="text-center text-xs text-text-muted">
        To appear on the leaderboard,{" "}
        <Link href="/settings/privacy" className="text-accent hover:underline">
          make your profile public
        </Link>
      </p>
    </div>
  );
}
