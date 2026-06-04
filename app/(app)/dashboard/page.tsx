"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { PerformanceSummaryCards } from "@/domains/analysis/components/PerformanceSummaryCards";
import { PerformanceTrendChart } from "@/domains/analysis/components/PerformanceTrendChart";
import { RecentMatchList } from "@/domains/analysis/components/RecentMatchList";
import { ReportList } from "@/domains/coaching/components/ReportList";
import { RankedCard } from "@/domains/riot/components/RankedCard";
import { RankUpWidget } from "@/domains/riot/components/RankUpWidget";
import { TiltWidget } from "@/domains/analysis/components/TiltWidget";
import { TiltBreakModal } from "@/domains/analysis/components/TiltBreakModal";
import { WarmupWidget } from "@/domains/analysis/components/WarmupWidget";
import { SessionReadinessWidget } from "@/domains/analysis/components/SessionReadinessWidget";
import { TodaysFocusCard } from "@/domains/analysis/components/TodaysFocusCard";
import { LastGameInsightCard } from "@/domains/analysis/components/LastGameInsightCard";
import { ImprovementPlanWidget } from "@/domains/analysis/components/ImprovementPlanWidget";
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
      <div className="mx-auto max-w-4xl p-6">
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

  const headerAction = (
    <div className="flex items-center gap-2">
      <Badge variant={isPro ? "success" : "secondary"}>{isPro ? "Pro" : "Free"}</Badge>
      {accounts.length > 1 && (
        <select
          className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
          value={primaryId ?? ""}
          onChange={(e) => setSelectedAccountId(e.target.value)}
        >
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.gameName}#{a.tagLine}</option>
          ))}
        </select>
      )}
      <Link href="/coaching/chat">
        <Button size="sm" className="gap-1.5">
          <MessageCircle className="h-4 w-4" />
          Ask Your Coach
        </Button>
      </Link>
    </div>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <TiltBreakModal riotAccountId={primaryId} />

      <PageHeader
        title="Dashboard"
        subtitle={primaryAccount
          ? `${primaryAccount.gameName}#${primaryAccount.tagLine} · ${primaryAccount.region.toUpperCase()}`
          : undefined}
        action={headerAction}
      />

      {profileError ? (
        <EmptyState
          title="No match data yet"
          description="Sync your Riot account to load your match history and get coaching insights."
          action={<Link href="/settings/accounts"><Button variant="secondary" size="sm">Sync Account</Button></Link>}
        />
      ) : (
        <>
          {/* ── Today's Brief ──────────────────────────────────────── */}
          <section>
            <SectionLabel>Today's Brief</SectionLabel>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TodaysFocusCard riotAccountId={primaryId} />
              <SessionReadinessWidget riotAccountId={primaryId} />
            </div>
          </section>

          {/* ── Improvement Plan ───────────────────────────────────── */}
          <ImprovementPlanWidget riotAccountId={primaryId} />

          {/* ── Last Game ──────────────────────────────────────────── */}
          <LastGameInsightCard match={profile?.recentMatches[0]} isLoading={profileLoading} />

          {/* ── Ranked ─────────────────────────────────────────────── */}
          <section>
            <SectionLabel>Ranked</SectionLabel>
            <div className="space-y-3">
              <RankedCard riotAccountId={primaryId} />
              <RankUpWidget riotAccountId={primaryId} />
            </div>
          </section>

          {/* ── Mental State ───────────────────────────────────────── */}
          <section>
            <SectionLabel>Mental State</SectionLabel>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <TiltWidget riotAccountId={primaryId} />
              <WarmupWidget riotAccountId={primaryId} />
            </div>
          </section>

          {/* ── Performance ────────────────────────────────────────── */}
          <section>
            <SectionLabel>Performance</SectionLabel>
            <div className="space-y-3">
              <PerformanceSummaryCards profile={profile} isLoading={profileLoading} />
              <PerformanceTrendChart matches={profile?.recentMatches} isLoading={profileLoading} />
            </div>
          </section>

          {/* ── Recent Matches ─────────────────────────────────────── */}
          <section>
            <SectionLabel>Recent Matches</SectionLabel>
            <RecentMatchList matches={profile?.recentMatches} isLoading={profileLoading} />
          </section>
        </>
      )}

      {/* ── Coaching Reports ─────────────────────────────────────── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <SectionLabel>Coaching Reports</SectionLabel>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={handleClimbRoadmap}
              disabled={generateReport.isPending || !profile || profileLoading}
              title="AI climb plan using your last 10 games">
              {generateReport.isPending ? "Generating…" : "Climb Roadmap"}
            </Button>
            <Button size="sm" onClick={handleGenerate}
              disabled={generateReport.isPending || !profile || profileLoading}>
              {generateReport.isPending ? "Generating…" : "Session Review"}
            </Button>
          </div>
        </div>
        {generateReport.isError && (
          <p className="mb-2 text-xs text-danger">{generateReport.error.message}</p>
        )}
        <ReportList reports={reports} isLoading={reportsLoading} />
      </section>
    </div>
  );
}
