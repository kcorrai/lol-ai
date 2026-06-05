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
  const color = pct >= 67 ? "bg-green-500" : pct >= 34 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-text-muted">
        <span>Hedefe yakınlık</span>
        <span className={cn(pct >= 67 ? "text-green-400" : pct >= 34 ? "text-yellow-500" : "text-red-400")}>
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
          title="Hesap Bağlı Değil"
          description="Roadmap'i görmek için Riot hesabını bağla."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5 p-6">
      <PageHeader
        title="Rank Roadmap"
        subtitle="Hedefini belirle, 14 günlük planınla ilerle."
      />

      {/* Rank goal selector */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">Rank Hedefi</p>
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
              Tahmini{" "}
              <span className="font-semibold text-text">≈ {rankUp.estimatedGames} maç</span>
              {" "}({Math.round(rankUp.recentWinRate)}% WR ile)
            </p>
          )}
        </div>
      )}

      {/* 14-day improvement plan */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-widest text-text-muted">14 Günlük Plan</p>
        <ImprovementPlanWidget riotAccountId={primaryId} />
      </div>
    </div>
  );
}
