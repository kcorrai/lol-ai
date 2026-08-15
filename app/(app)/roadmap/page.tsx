"use client";

import { Target } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ImprovementPlanWidget } from "@/domains/analysis/components/ImprovementPlanWidget";
import { RankGoalSelector } from "@/domains/analysis/components/RankGoalSelector";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useRankedData } from "@/hooks/useRankedData";
import { useRankUpProbability } from "@/hooks/useRankUpProbability";
import { useUIStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

function ProgressBar({ score }: { score: number }) {
  const pct = Math.min(100, Math.max(0, score));
  const color = pct >= 67 ? "bg-accent" : pct >= 34 ? "bg-warning" : "bg-danger";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-muted">
        <span>Progress to Goal</span>
        <span className={cn(pct >= 67 ? "text-accent" : pct >= 34 ? "text-warning" : "text-danger")}>
          {pct}%
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function RoadmapPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const primaryId = accounts?.[0]?.id ?? null;
  const { data: ranked } = useRankedData(primaryId);
  const { data: rankUp } = useRankUpProbability(primaryId);
  const { rankGoal, setRankGoal } = useUIStore();

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <EmptyState
          icon={<Target className="h-14 w-14" />}
          title="Account Not Connected"
          description="Connect your Riot account to see the roadmap."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <PageHeader
        title="Rank Roadmap"
        subtitle="Set your goal, progress with your 14-day plan."
      />

      {/* Rank goal selector */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">Rank Goal</p>
        <RankGoalSelector
          currentRank={ranked?.rank ?? null}
          value={rankGoal}
          onChange={setRankGoal}
        />
      </div>

      {/* Progress */}
      {rankUp && rankGoal && (
        <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
          <ProgressBar score={rankUp.score} />
          {rankUp.estimatedGames !== null && (
            <p className="text-sm text-text-muted">
              Estimated{" "}
              <span className="font-semibold text-text">≈ {rankUp.estimatedGames} matches</span>
              {" "}({Math.round(rankUp.recentWinRate)}% WR)
            </p>
          )}
        </div>
      )}

      {/* 14-day improvement plan */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">14-Day Plan</p>
        <ImprovementPlanWidget riotAccountId={primaryId} />
      </div>
    </div>
  );
}
