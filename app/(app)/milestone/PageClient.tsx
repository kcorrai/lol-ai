"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Flame, Swords, Clock, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { useMilestone } from "@/hooks/useMilestone";
import { cn } from "@/lib/utils";
import { MilestoneRankJourney } from "./MilestoneRankJourney";
import { MilestoneChampionList } from "./MilestoneChampionList";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function StatCard({
  icon: Icon, label, value, sub, highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub?: string;
  highlight?: "success" | "danger" | "accent";
}) {
  const valueClass =
    highlight === "success" ? "text-success"
    : highlight === "danger" ? "text-danger"
    : highlight === "accent" ? "text-accent"
    : "text-text";
  return (
    <div className="gaming-card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", valueClass)}>{value}</p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="gaming-card p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function MilestonePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  function prev() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function next() {
    const isCurrentOrFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (isCurrentOrFuture) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const { data, isLoading } = useMilestone(year, month);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <PageHeader
        title="Monthly Milestone"
        subtitle="Complete summary of a month — statistics, rank journey, top performances"
        action={<Trophy className="h-5 w-5 text-accent" />}
      />

      <div className="flex items-center gap-3">
        <button onClick={prev} className="rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:border-accent/30 hover:text-accent">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
          <Calendar className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-text">{MONTH_NAMES[month - 1]} {year}</span>
          {isCurrent && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">This Month</span>
          )}
        </div>
        <button onClick={next} disabled={isCurrent} className="rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-30">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !data ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
          <p className="text-sm font-medium text-text">No data for this month</p>
          <p className="mt-1 text-xs text-text-muted">No ranked solo matches found for {MONTH_NAMES[month - 1]} {year}.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={Swords} label="Matches" value={String(data.gamesPlayed)} sub={`${data.wins}W · ${data.losses}L`} highlight={data.winRate >= 55 ? "success" : data.winRate < 45 ? "danger" : undefined} />
            <StatCard icon={TrendingUp} label="Win Rate" value={`${data.winRate}%`} sub="Ranked Solo" highlight={data.winRate >= 55 ? "success" : data.winRate < 45 ? "danger" : undefined} />
            <StatCard icon={Flame} label="Avg KDA" value={data.avgKda.toFixed(2)} sub={`Best: ${data.bestKda.toFixed(2)}`} highlight={data.avgKda >= 3 ? "success" : data.avgKda < 2 ? "danger" : undefined} />
            <StatCard icon={Clock} label="Duration" value={`${data.estimatedHours}h`} sub={`${data.avgCsPerMin.toFixed(1)} CS/min avg.`} />
          </div>

          {data.bestWinStreak >= 3 && (
            <div className="gaming-card-accent flex items-center gap-3 px-4 py-3">
              <Flame className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-bold text-text">{data.bestWinStreak} win streak!</p>
                <p className="text-xs text-text-muted">Your best performance this month.</p>
              </div>
            </div>
          )}

          <MilestoneRankJourney rankStart={data.rankStart} rankEnd={data.rankEnd} lpChange={data.lpChange} />
          <MilestoneChampionList champions={data.topChampions} />
        </div>
      )}
    </div>
  );
}
