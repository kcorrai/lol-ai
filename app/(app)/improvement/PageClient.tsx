"use client";

import Link from "next/link";
import { TrendingUp, History } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ImprovementPlanWidget } from "@/domains/analysis/components/ImprovementPlanWidget";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanHistory } from "@/hooks/useImprovementPlan";
import { useOnboardingPreview } from "@/domains/onboarding/preview/OnboardingPreviewContext";
import { ImprovementHistoryPreview } from "./ImprovementHistoryPreview";
import type { PlanHistoryEntry } from "@/domains/analysis/services/improvementPlanService";
import { cn } from "@/lib/utils";

function PlanHistoryCard({ entry }: { entry: PlanHistoryEntry }) {
  const date = new Date(entry.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short" });
  const exDate = new Date(entry.expiresAt).toLocaleDateString("en-US", { day: "numeric", month: "short" });
  const score = entry.weeklyScore;
  const scoreColor = score >= 66 ? "text-success" : score >= 33 ? "text-warning" : "text-danger";
  const barColor = score >= 66 ? "bg-success" : score >= 33 ? "bg-warning" : "bg-danger/60";
  const isActive = entry.status === "active";

  return (
    <div className={cn("rounded-xl border bg-surface p-4", isActive ? "border-accent/30" : "border-border")}>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text">{date} — {exDate}</p>
          <p className="mt-0.5 text-xs text-text-muted">
            {entry.completedCount}/{entry.totalTargets} targets completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
              Active
            </span>
          )}
          <span className={cn("text-xl font-bold tabular-nums", scoreColor)}>{score}</span>
        </div>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function SectionHeader({ icon, label, badge }: { icon: React.ReactNode; label: string; badge?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-surface-2 text-text-muted">
        {icon}
      </div>
      <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">{label}</h2>
      {badge}
    </div>
  );
}

export default function ImprovementPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const { data: subscription } = useSubscription();
  const primaryAccount = accounts?.find((a) => a.isPrimary) ?? accounts?.[0];
  const riotAccountId = primaryAccount?.id ?? null;
  const isPro = subscription?.plan === "pro" || subscription?.plan === "elite";
  const { data: history, isLoading: historyLoading } = usePlanHistory(riotAccountId);
  const { previewActive } = useOnboardingPreview();

  if (accountsLoading) return <PageSkeleton />;

  if (!primaryAccount) {
    return (
      <div className="space-y-6">
        <PageHeader title="Improvement Tracking" subtitle="Set your goals, track your progress." />
        <EmptyState
          title="Riot account not connected"
          description="First, connect your Riot account to create an improvement plan."
          action={
            <Link href="/settings/accounts" className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90">
              Connect Account
            </Link>
          }
        />
      </div>
    );
  }

  const historyEntries = Array.isArray(history) ? (history as PlanHistoryEntry[]) : [];

  return (
    <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
      <PageHeader
        title="Improvement Tracking"
        subtitle="Are you meeting the goals set by your AI coach?"
        action={<TrendingUp className="h-5 w-5 text-text-muted" aria-hidden />}
      />

      {/* Active plan */}
      <section className="space-y-4">
        <SectionHeader
          icon={<span className="relative flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-60" /><span className="relative inline-flex h-2 w-2 rounded-full bg-accent" /></span>}
          label="Active Plan"
        />
        <ImprovementPlanWidget riotAccountId={riotAccountId} />
      </section>

      {/* History */}
      <section className="space-y-4">
        <SectionHeader
          icon={<History className="h-3.5 w-3.5" />}
          label="Past Plans"
          badge={historyEntries.length > 0 ? (
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">{historyEntries.length}</span>
          ) : undefined}
        />

        {historyLoading ? (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl border border-border bg-surface" />
            ))}
          </div>
        ) : historyEntries.length === 0 ? (
          previewActive ? (
            <ImprovementHistoryPreview />
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-surface/50 py-12 text-center">
              <History className="h-8 w-8 text-text-muted/40" />
              <p className="text-sm font-medium text-text-muted">No completed plans yet</p>
              <p className="text-xs text-text-muted/60">They will appear here once you complete your active plan.</p>
            </div>
          )
        ) : (
          <div className="space-y-4">
            {historyEntries.map((entry) => (
              <PlanHistoryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {!isPro && historyEntries.length > 0 && (
          <p className="pt-2 text-center text-xs text-text-muted">
            For unlimited plan history,{" "}
            <Link href="/settings/billing" className="text-accent hover:underline">upgrade to Pro</Link>
          </p>
        )}
      </section>
    </div>
  );
}
