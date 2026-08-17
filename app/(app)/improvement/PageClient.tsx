"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useSubscription } from "@/hooks/useSubscription";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useRankedData } from "@/hooks/useRankedData";
import { useImprovementPlan, useGeneratePlan, usePlanHistory } from "@/hooks/useImprovementPlan";
import { useOnboardingPreview } from "@/domains/onboarding/preview/OnboardingPreviewContext";
import { ImprovementHistoryPreview } from "./ImprovementHistoryPreview";
import { PlanEmptyState } from "./PlanEmptyState";
import { PlanStatusHero } from "./PlanStatusHero";
import { PlanTargets } from "./PlanTargets";
import { PlanProgressChart } from "./PlanProgressChart";
import { PlanHistoryTable } from "./PlanHistoryTable";
import { PlanWindowSummary, type SummaryRow } from "./PlanWindowSummary";
import type { PlanHistoryEntry } from "@/domains/analysis/services/improvementPlanService";
import type { LpSnapshot } from "@/domains/riot";

/** LP moved across the plan's own window, or null when no snapshot covers it. */
function lpChangeInWindow(
  history: LpSnapshot[] | undefined,
  fromIso: string,
  toIso: string
): number | null {
  if (!history || history.length < 2) return null;
  const from = new Date(fromIso).getTime();
  const to = new Date(toIso).getTime();
  const inside = history
    .filter((s) => {
      const at = new Date(s.recordedAt).getTime();
      return at >= from && at <= to;
    })
    .sort((a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime());
  if (inside.length < 2) return null;
  return inside[inside.length - 1].lp - inside[0].lp;
}

export default function ImprovementPage(): React.JSX.Element {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const primaryAccount = accounts?.find((a) => a.isPrimary) ?? accounts?.[0];
  const riotAccountId = primaryAccount?.id ?? null;

  const { data: subscription } = useSubscription();
  const { data: plan, isLoading: planLoading } = useImprovementPlan(riotAccountId);
  const { data: history, isLoading: historyLoading } = usePlanHistory(riotAccountId);
  const { data: profile } = usePerformanceProfile(riotAccountId);
  const { data: ranked } = useRankedData(riotAccountId);
  const generate = useGeneratePlan(riotAccountId);
  const { previewActive } = useOnboardingPreview();

  const isPro = subscription?.plan === "pro" || subscription?.plan === "elite";

  if (accountsLoading) return <PageSkeleton />;

  if (!primaryAccount) {
    return (
      <div className="mx-auto max-w-2xl space-y-10 px-4 py-8">
        <EmptyState
          title="Riot account not connected"
          description="First, connect your Riot account to create an improvement plan."
          action={
            <Link
              href="/settings/accounts"
              className="notch-sm bg-acid-500 px-4 py-2 text-sm font-medium text-ink-1000 hover:bg-acid-400"
            >
              Connect Account
            </Link>
          }
        />
      </div>
    );
  }

  const historyEntries = Array.isArray(history) ? (history as PlanHistoryEntry[]) : [];
  const lpChange = plan ? lpChangeInWindow(ranked?.lpHistory, plan.createdAt, plan.expiresAt) : null;

  const summaryRows: SummaryRow[] = [];
  if (profile) {
    summaryRows.push({ label: "Games analysed", value: String(profile.gamesAnalyzed) });
    summaryRows.push({
      label: "Win rate",
      value: `${Math.round(profile.winRate)}%`,
      accent: profile.winRate >= 50,
    });
  }
  if (lpChange !== null) {
    summaryRows.push({
      label: "LP change",
      value: `${lpChange > 0 ? "+" : ""}${lpChange}`,
      accent: lpChange > 0,
    });
  }
  if (ranked?.rank) {
    summaryRows.push({
      label: "Rank",
      value: `${ranked.rank.tier} ${ranked.rank.division} · ${ranked.rank.lp} LP`,
    });
  }
  if (historyEntries.length > 0) {
    summaryRows.push({ label: "Plans on record", value: String(historyEntries.length) });
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-line-1 bg-surface/70 px-5 backdrop-blur sm:px-8">
        <Link
          href="/dashboard"
          className="font-mono text-[10.5px] uppercase tracking-label text-fg-3 hover:text-fg-1"
        >
          ← Dashboard
        </Link>
        <span className="h-4 w-px bg-line-2" />
        <span className="font-display text-sm font-bold uppercase tracking-wide text-fg-1">
          Improvement
        </span>
        {historyEntries.length > 0 && (
          <span className="hidden font-mono text-[10.5px] uppercase tracking-wide text-fg-4 sm:inline">
            {historyEntries.length} plan{historyEntries.length === 1 ? "" : "s"}
            {profile ? ` · ${profile.gamesAnalyzed} games tracked` : ""}
          </span>
        )}
        <Link
          href="/coaching/chat"
          className="notch-sm ml-auto inline-flex items-center gap-2 border border-line-2 px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-label text-fg-2 transition-colors hover:border-acid-500 hover:text-acid-500"
        >
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          Ask your coach
        </Link>
      </header>

      <main className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 sm:px-8">
        {planLoading ? (
          <div className="notch h-52 animate-pulse border border-border bg-surface" />
        ) : !plan ? (
          <PlanEmptyState onCreate={() => generate.mutate()} isPending={generate.isPending} />
        ) : (
          <div>
            <PlanStatusHero
              plan={plan}
              gamesInWindow={profile?.gamesAnalyzed ?? null}
              lpChange={lpChange}
              onCreate={() => generate.mutate()}
              isPending={generate.isPending}
            />

            <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_306px]">
              <div className="grid min-w-0 gap-4">
                <PlanTargets targets={plan.targets} planEnded={plan.status === "expired"} />

                {profile && (
                  <PlanProgressChart matches={profile.recentMatches} targets={plan.targets} />
                )}

                {historyLoading ? (
                  <div className="notch h-40 animate-pulse border border-border bg-surface" />
                ) : historyEntries.length > 0 ? (
                  <PlanHistoryTable entries={historyEntries} />
                ) : previewActive ? (
                  <ImprovementHistoryPreview />
                ) : (
                  <section className="notch border border-dashed border-line-2 bg-surface/50 px-5 py-10 text-center">
                    <p className="text-sm font-medium text-text-muted">No completed plans yet</p>
                    <p className="mt-1 text-xs text-text-muted/60">
                      They will appear here once you complete your active plan.
                    </p>
                  </section>
                )}

                {!isPro && historyEntries.length > 0 && (
                  <p className="text-center text-xs text-text-muted">
                    For unlimited plan history,{" "}
                    <Link href="/settings/billing" className="text-acid-500 hover:underline">
                      upgrade to Pro
                    </Link>
                  </p>
                )}
              </div>

              <div className="grid gap-3.5 lg:sticky lg:top-[76px]">
                <PlanWindowSummary rows={summaryRows} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
