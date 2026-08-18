"use client";

import { Suspense } from "react";
import { RecentMatchList } from "@/domains/analysis/components/RecentMatchList";
import { WinrateTrendWidget } from "@/domains/analysis/components/WinrateTrendWidget";
import { PerformanceTrendChart } from "@/domains/analysis/components/PerformanceTrendChart";
import { ImprovementPlanWidget } from "@/domains/analysis/components/ImprovementPlanWidget";
import { HabitDetectionCard } from "@/domains/analysis/components/HabitDetectionWidget";
import { TiltBreakModal } from "@/domains/analysis/components/TiltBreakModal";
import { PatchImpactWidget } from "@/components/dashboard/PatchImpactWidget";
import { MetaRecommendationsWidget } from "@/components/dashboard/MetaRecommendationsWidget";
import { WeekSummaryWidget } from "@/components/dashboard/WeekSummaryWidget";
import { DailyMomentumChart } from "@/components/dashboard/DailyMomentumChart";
import { DuoPanel } from "@/components/dashboard/laneiq/duo/DuoPanel";
import { DevRestartOnboarding } from "@/components/dashboard/DevRestartOnboarding";
import { ClaimAccountOnArrival } from "@/components/dashboard/ClaimAccountOnArrival";
import { resolveDashboardView } from "@/components/dashboard/dashboardView";
import { DashboardHeader } from "@/components/dashboard/laneiq/DashboardHeader";
import { DailyQuestStrip } from "@/components/dashboard/laneiq/DailyQuestStrip";
import { ReadinessVerdict } from "@/components/dashboard/laneiq/ReadinessVerdict";
import { FocusColumn } from "@/components/dashboard/laneiq/FocusColumn";
import { LastGameColumn } from "@/components/dashboard/laneiq/LastGameColumn";
import { AnalysisDeltas } from "@/components/dashboard/laneiq/AnalysisDeltas";
import { PlaystyleProfile } from "@/components/dashboard/laneiq/PlaystyleProfile";
import { ChampionPoolPanel } from "@/components/dashboard/laneiq/ChampionPoolPanel";
import { EngagementStrip } from "@/components/dashboard/laneiq/EngagementStrip";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import {
  DashboardSkeleton,
  NoAccountState,
  SyncErrorState,
  SyncingState,
} from "@/components/dashboard/laneiq/DashboardStates";
import { EmailVerificationBanner } from "@/components/ui/EmailVerificationBanner";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useAutoSync } from "@/hooks/useAutoSync";
import { useUIStore } from "@/lib/stores/uiStore";

export default function DashboardPage(): React.ReactElement {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();

  // The account switcher lives in the app shell's top bar and writes to the UI
  // store. Reading it here is what makes switching accounts up there actually
  // change the dashboard — a second, locally-stated switcher did not.
  const activeAccountId = useUIStore((s) => s.activeRiotAccountId);

  const primaryId = activeAccountId ?? accounts?.[0]?.id ?? null;
  const primaryAccount = accounts?.find((a) => a.id === primaryId);

  const {
    data: profile,
    isLoading: profileLoading,
    error: profileError,
  } = usePerformanceProfile(primaryId);
  const { data: sub } = useSubscription();

  // Keep match data current on its own — silently re-sync a stale account on load (TASK-221).
  useAutoSync(primaryId, primaryAccount?.lastSyncedAt);

  const view = resolveDashboardView(accountsLoading, accounts?.length ?? 0);

  // `!accounts` is unreachable once the view is "ready" — it narrows the type below.
  if (view !== "ready" || !accounts) {
    return (
      <div className="mx-auto flex max-w-[1240px] flex-col gap-4 p-6">
        {/* Mounted before the account exists on purpose: an arriving claim is precisely the case
            where there is nothing to show yet. */}
        <Suspense fallback={null}>
          <ClaimAccountOnArrival />
        </Suspense>
        {view === "loading" ? <DashboardSkeleton /> : <NoAccountState />}
        <DevRestartOnboarding />
      </div>
    );
  }

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";
  const hasMatches = (profile?.recentMatches?.length ?? 0) > 0;

  return (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5 p-5 md:p-6">
      <Suspense fallback={null}>
        <ClaimAccountOnArrival />
      </Suspense>
      <Suspense fallback={null}>
        <EmailVerificationBanner />
      </Suspense>
      <TiltBreakModal riotAccountId={primaryId} />
      <DevRestartOnboarding />

      <DashboardHeader account={primaryAccount} isPro={isPro} />

      {/* Above the verdict on purpose: the quest is the reason to come back today, and it
          reads as an afterthought anywhere below the fold. Outside the profile branch too —
          its on-site leg is finishable while the match sync is still catching up. */}
      <DailyQuestStrip />

      {profileError ? (
        <SyncErrorState />
      ) : profileLoading ? (
        <DashboardSkeleton />
      ) : !hasMatches ? (
        <SyncingState gameName={primaryAccount?.gameName} />
      ) : (
        <>
          {/* ── Layer 1 · Decision ─────────────────────────────────────── */}
          <HudPanel className="notch-lg">
            <div className="grid grid-cols-1 items-stretch lg:grid-cols-[300px_1fr_1fr]">
              <ReadinessVerdict riotAccountId={primaryId} />
              <FocusColumn riotAccountId={primaryId} profile={profile} />
              <LastGameColumn match={profile?.recentMatches[0]} isLoading={profileLoading} />
            </div>
          </HudPanel>

          {/* Layer 2 shares the page with the duo rail. Everything in the main column answers
              "how am I playing"; the rail answers "how are *we* playing", which is a different
              unit of analysis and so gets its own column rather than a widget slot.
              On phones the rail comes first — under the verdict, above the analysis. */}
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_336px]">
            <aside className="order-first min-w-0 lg:order-none lg:sticky lg:top-6">
              <DuoPanel riotAccountId={primaryId} />
            </aside>

            <div className="flex min-w-0 flex-col gap-4 lg:order-first">
              {/* ── Layer 2 · Analysis ───────────────────────────────── */}
              <HudRule label="// Analysis · last 20 games" />

              <AnalysisDeltas profile={profile} isLoading={profileLoading} />

              {/* One two-column flow, not a stack of row-grids. Widgets differ wildly in height,
                  so a per-row grid parked the short side on a void until the tall side caught up —
                  three of them down the page. Two continuous columns let each side keep packing,
                  which leaves a single ragged edge at the bottom instead.
                  Two columns, not three: the duo widget that used to sit here is the rail now. */}
              <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.5fr_1fr]">
                <div className="flex min-w-0 flex-col gap-4">
                  <DailyMomentumChart riotAccountId={primaryId} />
                  <PerformanceTrendChart
                    matches={profile?.recentMatches}
                    isLoading={profileLoading}
                  />
                  <ImprovementPlanWidget riotAccountId={primaryId} />
                  <ChampionPoolPanel matches={profile?.recentMatches} isLoading={profileLoading} />
                </div>
                <div className="flex min-w-0 flex-col gap-4">
                  <PlaystyleProfile profile={profile} isLoading={profileLoading} />
                  <WinrateTrendWidget
                    matches={profile?.recentMatches}
                    isLoading={profileLoading}
                  />
                  <WeekSummaryWidget matches={profile?.recentMatches} isLoading={profileLoading} />
                  <PatchImpactWidget riotAccountId={primaryId} />
                  <MetaRecommendationsWidget riotAccountId={primaryId} />
                  <HabitDetectionCard riotAccountId={primaryId} />
                </div>
              </div>

            </div>
          </div>

          {/* ── Layer 3 · Archive ──────────────────────────────────────── */}
          {/* Outside the rail grid on purpose. The rail is a few hundred pixels tall and the log
              runs for thousands, so keeping the log in the rail's column left the whole right-hand
              strip empty for the rest of the page. Full width instead. */}
          <HudRule label="// Match log" />
          <RecentMatchList matches={profile?.recentMatches} isLoading={profileLoading} />

          <EngagementStrip />
        </>
      )}
    </div>
  );
}
