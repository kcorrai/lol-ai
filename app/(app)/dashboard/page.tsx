"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
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
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useCoachingReports } from "@/hooks/useCoachingReports";
import { useGenerateReport } from "@/hooks/useGenerateReport";
import { useRankedData } from "@/hooks/useRankedData";
import { useSubscription } from "@/hooks/useSubscription";

export default function DashboardPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const primaryId = selectedAccountId ?? accounts?.[0]?.id ?? null;
  const primaryAccount = accounts?.find((a) => a.id === primaryId);

  const { data: profile, isLoading: profileLoading, error: profileError } = usePerformanceProfile(primaryId);
  const { data: reports, isLoading: reportsLoading } = useCoachingReports(primaryId ?? undefined);
  const { data: rankedData, isLoading: rankedLoading } = useRankedData(primaryId);
  const { data: sub } = useSubscription();
  const generateReport = useGenerateReport();

  function handleGenerate() {
    if (!primaryId || !profile) return;
    const matchIds = profile.recentMatches.slice(0, 5).map((m) => m.matchDbId);
    generateReport.mutate({ riotAccountId: primaryId, reportType: "session_review", matchIds });
  }

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          icon={<Gamepad2 className="h-16 w-16" />}
          title="Connect Your Riot Account"
          description="Link your League of Legends account to get AI-powered coaching on your recent matches."
          action={
            <Link href="/settings/accounts">
              <Button size="lg">Get Started →</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";
  const planBadge = (
    <Badge variant={isPro ? "success" : "secondary"}>
      {isPro ? "Pro" : "Free"}
    </Badge>
  );

  const accountSelector =
    accounts.length > 1 ? (
      <select
        className="rounded-md border border-border bg-surface px-2 py-1.5 text-sm text-text"
        value={primaryId ?? ""}
        onChange={(e) => setSelectedAccountId(e.target.value)}
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.gameName}#{a.tagLine}
          </option>
        ))}
      </select>
    ) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <PageHeader
        title="Dashboard"
        subtitle={
          primaryAccount
            ? `${primaryAccount.gameName}#${primaryAccount.tagLine} · ${primaryAccount.region.toUpperCase()}`
            : undefined
        }
        action={
          <div className="flex items-center gap-2">
            {planBadge}
            {accountSelector}
          </div>
        }
      />

      {profileError ? (
        <EmptyState
          title="No match data yet"
          description="Sync your Riot account to load your match history and get coaching insights."
          action={
            <Link href="/settings/accounts">
              <Button variant="secondary" size="sm">Sync Account</Button>
            </Link>
          }
        />
      ) : (
        <>
          <RankedCard
            rank={rankedData?.rank}
            lpHistory={rankedData?.lpHistory}
            isLoading={rankedLoading}
          />

          <section>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
              Performance
            </p>
            <PerformanceSummaryCards profile={profile} isLoading={profileLoading} />
          </section>

          <PerformanceTrendChart matches={profile?.recentMatches} isLoading={profileLoading} />

          <section>
            <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
              Recent Matches
            </p>
            <RecentMatchList matches={profile?.recentMatches} isLoading={profileLoading} />
          </section>
        </>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Coaching Reports
          </p>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generateReport.isPending || !profile || profileLoading}
          >
            {generateReport.isPending ? "Generating…" : "Generate Report"}
          </Button>
        </div>
        {generateReport.isError && (
          <p className="mb-2 text-xs text-danger">{generateReport.error.message}</p>
        )}
        <ReportList reports={reports} isLoading={reportsLoading} />
      </section>
    </div>
  );
}
