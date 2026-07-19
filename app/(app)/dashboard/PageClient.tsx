"use client";

import { Suspense, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { profileIconUrl, championSplashUrl } from "@/lib/ddragon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { PerformanceSummaryCards } from "@/domains/analysis/components/PerformanceSummaryCards";
import { RecentMatchesSummaryCard } from "@/domains/analysis/components/RecentMatchesSummaryCard";
import { PerformanceTrendChart } from "@/domains/analysis/components/PerformanceTrendChart";
import { RecentMatchList } from "@/domains/analysis/components/RecentMatchList";
import { TiltWidget } from "@/domains/analysis/components/TiltWidget";
import { TiltBreakModal } from "@/domains/analysis/components/TiltBreakModal";
import { WarmupWidget } from "@/domains/analysis/components/WarmupWidget";
import { SessionReadinessWidget } from "@/domains/analysis/components/SessionReadinessWidget";
import { TodaysFocusCard } from "@/domains/analysis/components/TodaysFocusCard";
import { LastGameInsightCard } from "@/domains/analysis/components/LastGameInsightCard";
import { ImprovementPlanWidget } from "@/domains/analysis/components/ImprovementPlanWidget";
import { WinrateTrendWidget } from "@/domains/analysis/components/WinrateTrendWidget";
import { TopChampionsWidget } from "@/domains/analysis/components/TopChampionsWidget";
import { RoleDistributionWidget } from "@/domains/analysis/components/RoleDistributionWidget";
import { HabitDetectionCard } from "@/domains/analysis/components/HabitDetectionWidget";
import { PatchImpactWidget } from "@/components/dashboard/PatchImpactWidget";
import { MetaRecommendationsWidget } from "@/components/dashboard/MetaRecommendationsWidget";
import { DailyChallengeWidget } from "@/components/dashboard/DailyChallengeWidget";
import { XpLevelWidget } from "@/components/dashboard/XpLevelWidget";
import { WeekSummaryWidget } from "@/components/dashboard/WeekSummaryWidget";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useSubscription } from "@/hooks/useSubscription";
import { useAutoSync } from "@/hooks/useAutoSync";
import { EmailVerificationBanner } from "@/components/ui/EmailVerificationBanner";
import { ReferralWidget } from "@/domains/identity/components/ReferralWidget";
import { ProgressionStrip } from "@/components/dashboard/ProgressionStrip";
import { DevRestartOnboarding } from "@/components/dashboard/DevRestartOnboarding";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
      {children}
    </p>
  );
}

export default function DashboardPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const primaryId = selectedAccountId ?? accounts?.[0]?.id ?? null;
  const primaryAccount = accounts?.find((a) => a.id === primaryId);

  const { data: profile, isLoading: profileLoading, error: profileError } = usePerformanceProfile(primaryId);
  const { data: sub } = useSubscription();

  // Keep match data current on its own — silently re-sync a stale account on load (TASK-221).
  useAutoSync(primaryId, primaryAccount?.lastSyncedAt);

  if (accountsLoading || !accounts || accounts.length === 0) {
    return (
      <>
        <PageSkeleton />
        <DevRestartOnboarding />
      </>
    );
  }

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <Suspense fallback={null}>
        <EmailVerificationBanner />
      </Suspense>
      <TiltBreakModal riotAccountId={primaryId} />
      <DevRestartOnboarding />

      {/* ── Player Header — cinematic banner ──────────────────────────── */}
      {(() => {
        const featuredChamp = profile?.recentMatches?.[0]?.champion ?? null;
        return (
          <div className="relative overflow-hidden rounded-2xl border border-border">
            {featuredChamp && (
              <>
                <Image fill alt="" aria-hidden src={championSplashUrl(featuredChamp)}
                  className="object-cover object-[60%_15%] opacity-[0.18]"
                  style={{ filter: "blur(2px) saturate(0.55)" }} />
                <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/75 to-transparent" />
              </>
            )}
            <div className="relative flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                {primaryAccount && (
                  <div className="relative shrink-0">
                    <Image src={profileIconUrl(primaryAccount.profileIconId)} alt={primaryAccount.gameName}
                      width={72} height={72} unoptimized
                      className="rounded-full border-2 border-accent/30 shadow-[0_0_16px_rgba(200,155,60,0.25)]" />
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-muted ring-1 ring-border">
                      {primaryAccount.summonerLevel}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-text">
                      {primaryAccount
                        ? <>{primaryAccount.gameName}<span className="text-text-muted/70">#{primaryAccount.tagLine}</span></>
                        : "Dashboard"}
                    </h1>
                    <Badge variant={isPro ? "success" : "secondary"} className="text-xs">{isPro ? "Pro" : "Free"}</Badge>
                  </div>
                  {primaryAccount && (
                    <p className="text-sm text-text-muted">
                      {primaryAccount.region.toUpperCase()}
                      {accounts.length > 1 && (
                        <select className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text"
                          value={primaryId ?? ""} onChange={(e) => setSelectedAccountId(e.target.value)}>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.gameName}#{a.tagLine}</option>
                          ))}
                        </select>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <Link href="/coaching/chat" data-tour="ask-coach">
                <Button size="sm" className="gap-1.5"><MessageCircle className="h-4 w-4" />Ask Your Coach</Button>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* ── Player progression (level · XP · streak) ─────────────────── */}
      <ProgressionStrip summonerLevel={primaryAccount?.summonerLevel} isPro={isPro} />

      {profileError ? (
        <EmptyState
          title="No match data yet"
          description="Sync your Riot account to load match history and get coaching suggestions."
          action={<Link href="/settings/accounts"><Button variant="secondary" size="sm">Sync Account</Button></Link>}
        />
      ) : !profileLoading && (!profile?.recentMatches || profile.recentMatches.length === 0) ? (
        <div className="rounded-2xl border border-border bg-surface p-10 text-center space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 mx-auto">
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-text">Your match data is being synced</h2>
            <p className="mt-2 text-sm text-text-muted max-w-sm mx-auto">
              Your Riot account is connected. Your match history is being prepared in the background — this may take a few minutes.
              You don&apos;t need to wait, you can get your first AI report now.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <Link href="/coaching">
              <Button size="lg" className="gap-2">
                Get My First Report →
              </Button>
            </Link>
            <Link href="/settings/accounts" className="text-xs text-text-muted hover:text-text transition-colors">
              Manual sync
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* ── Top summary ────────────────────────────────────────────── */}
          <PerformanceSummaryCards profile={profile} isLoading={profileLoading} />
          <RecentMatchesSummaryCard profile={profile} isLoading={profileLoading} />

          {/* ── This Week Summary ──────────────────────────────────────── */}
          <WeekSummaryWidget matches={profile?.recentMatches} isLoading={profileLoading} />

          {/* ── Today's Brief ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TodaysFocusCard riotAccountId={primaryId} />
            <SessionReadinessWidget riotAccountId={primaryId} />
          </div>

          {/* ── Main 2-column layout ───────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-2">
              <div>
                <SectionLabel>Top Champions</SectionLabel>
                <TopChampionsWidget matches={profile?.recentMatches} isLoading={profileLoading} />
              </div>
              <div>
                <SectionLabel>Roles</SectionLabel>
                <RoleDistributionWidget matches={profile?.recentMatches} isLoading={profileLoading} />
              </div>
              <div>
                <SectionLabel>Mental State</SectionLabel>
                <div className="space-y-3">
                  <TiltWidget riotAccountId={primaryId} />
                  <WarmupWidget riotAccountId={primaryId} />
                </div>
              </div>
              <div>
                <SectionLabel>Habits</SectionLabel>
                <HabitDetectionCard riotAccountId={primaryId} />
              </div>
              <div>
                <SectionLabel>This Patch</SectionLabel>
                <MetaRecommendationsWidget riotAccountId={primaryId} />
              </div>
              <div>
                <SectionLabel>Patch Impact</SectionLabel>
                <PatchImpactWidget riotAccountId={primaryId} />
              </div>
              <div data-tour="daily-tasks">
                <SectionLabel>Daily Tasks</SectionLabel>
                <div className="space-y-3">
                  <XpLevelWidget />
                  <DailyChallengeWidget />
                </div>
              </div>
              <div>
                <SectionLabel>Invite Friends</SectionLabel>
                <ReferralWidget />
              </div>
            </div>
            <div className="space-y-4 lg:col-span-3">
              <LastGameInsightCard match={profile?.recentMatches[0]} isLoading={profileLoading} />
              <ImprovementPlanWidget riotAccountId={primaryId} />
              <WinrateTrendWidget matches={profile?.recentMatches} isLoading={profileLoading} />
              <PerformanceTrendChart matches={profile?.recentMatches} isLoading={profileLoading} />
            </div>
          </div>

          {/* ── Recent Matches ─────────────────────────────────────────── */}
          <section>
            <SectionLabel>Recent Matches</SectionLabel>
            <RecentMatchList matches={profile?.recentMatches} isLoading={profileLoading} />
          </section>
        </>
      )}
    </div>
  );
}
