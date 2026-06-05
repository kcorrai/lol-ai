"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Gamepad2, MessageCircle } from "lucide-react";
import { profileIconUrl } from "@/lib/ddragon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { PerformanceSummaryCards } from "@/domains/analysis/components/PerformanceSummaryCards";
import { RecentMatchesSummaryCard } from "@/domains/analysis/components/RecentMatchesSummaryCard";
import { PerformanceTrendChart } from "@/domains/analysis/components/PerformanceTrendChart";
import { RecentMatchList } from "@/domains/analysis/components/RecentMatchList";
import { ReportList } from "@/domains/coaching/components/ReportList";
import { CoachingActionsCard } from "@/domains/coaching/components/CoachingActionsCard";
import { RankedCard } from "@/domains/riot/components/RankedCard";
import { RankUpWidget } from "@/domains/riot/components/RankUpWidget";
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
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useCoachingReports } from "@/hooks/useCoachingReports";
import { useGenerateReport } from "@/hooks/useGenerateReport";
import { useSubscription } from "@/hooks/useSubscription";

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
  const { data: reports, isLoading: reportsLoading } = useCoachingReports(primaryId ?? undefined);
  const { data: sub } = useSubscription();
  const generateReport = useGenerateReport();

  function handleGenerate() {
    if (!primaryId || !profile) return;
    const matchIds = profile.recentMatches.slice(0, 5).map((m) => m.matchDbId);
    generateReport.mutate({ riotAccountId: primaryId, reportType: "session_review", matchIds });
  }

  function handleClimbRoadmap() {
    if (!primaryId || !profile) return;
    const matchIds = profile.recentMatches.slice(0, 10).map((m) => m.matchDbId);
    generateReport.mutate({ riotAccountId: primaryId, reportType: "climb_roadmap", matchIds });
  }

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <EmptyState
          icon={<Gamepad2 className="h-16 w-16" />}
          title="Connect Your Riot Account"
          description="Link your League of Legends account to get AI-powered coaching on your recent matches."
          action={<Link href="/settings/accounts"><Button size="lg">Get Started →</Button></Link>}
        />
      </div>
    );
  }

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <TiltBreakModal riotAccountId={primaryId} />

      {/* ── Player Header ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {primaryAccount && (
            <div className="relative shrink-0">
              <Image
                src={profileIconUrl(primaryAccount.profileIconId)}
                alt={primaryAccount.gameName}
                width={72}
                height={72}
                unoptimized
                className="rounded-full border-2 border-border"
              />
              <span className="absolute -bottom-1 -right-1 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-muted ring-1 ring-border">
                {primaryAccount.summonerLevel}
              </span>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-text">
                {primaryAccount
                  ? <>{primaryAccount.gameName}<span className="text-text-muted">#{primaryAccount.tagLine}</span></>
                  : "Dashboard"}
              </h1>
              <Badge variant={isPro ? "success" : "secondary"} className="text-xs">
                {isPro ? "Pro" : "Free"}
              </Badge>
            </div>
            {primaryAccount && (
              <p className="text-sm text-text-muted">
                {primaryAccount.region.toUpperCase()}
                {accounts.length > 1 && (
                  <select
                    className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text"
                    value={primaryId ?? ""}
                    onChange={(e) => setSelectedAccountId(e.target.value)}
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.gameName}#{a.tagLine}</option>
                    ))}
                  </select>
                )}
              </p>
            )}
          </div>
        </div>
        <Link href="/coaching/chat">
          <Button size="sm" className="gap-1.5">
            <MessageCircle className="h-4 w-4" />
            Ask Your Coach
          </Button>
        </Link>
      </div>

      {profileError ? (
        <EmptyState
          title="No match data yet"
          description="Sync your Riot account to load your match history and get coaching insights."
          action={<Link href="/settings/accounts"><Button variant="secondary" size="sm">Sync Account</Button></Link>}
        />
      ) : (
        <>
          {/* ── Top summary ────────────────────────────────────────────── */}
          <PerformanceSummaryCards profile={profile} isLoading={profileLoading} />
          <RecentMatchesSummaryCard profile={profile} isLoading={profileLoading} />

          {/* ── AI Coaching Actions ────────────────────────────────────── */}
          <div>
            <SectionLabel>Generate AI Report</SectionLabel>
            <CoachingActionsCard
              onSessionReview={handleGenerate}
              onClimbRoadmap={handleClimbRoadmap}
              isPending={generateReport.isPending}
              isDisabled={!profile || profileLoading}
            />
            {generateReport.isError && (
              <p className="mt-2 text-xs text-danger">{generateReport.error.message}</p>
            )}
          </div>

          {/* ── Today's Brief ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TodaysFocusCard riotAccountId={primaryId} />
            <SessionReadinessWidget riotAccountId={primaryId} />
          </div>

          {/* ── Main 2-column layout ───────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-2">
              <div>
                <SectionLabel>Ranked</SectionLabel>
                <div className="space-y-3">
                  <RankedCard riotAccountId={primaryId} />
                  <RankUpWidget riotAccountId={primaryId} />
                </div>
              </div>
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

      {/* ── Coaching Reports ────────────────────────────────────────── */}
      <section>
        <SectionLabel>Coaching Reports</SectionLabel>
        <ReportList reports={reports} isLoading={reportsLoading} />
      </section>
    </div>
  );
}
