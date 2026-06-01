"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PerformanceSummaryCards } from "@/domains/analysis/components/PerformanceSummaryCards";
import { PerformanceTrendChart } from "@/domains/analysis/components/PerformanceTrendChart";
import { RecentMatchList } from "@/domains/analysis/components/RecentMatchList";
import { ReportList } from "@/domains/coaching/components/ReportList";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useCoachingReports } from "@/hooks/useCoachingReports";
import { useGenerateReport } from "@/hooks/useGenerateReport";

export default function DashboardPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  const primaryId = selectedAccountId ?? accounts?.[0]?.id ?? null;
  const primaryAccount = accounts?.find((a) => a.id === primaryId);

  const { data: profile, isLoading: profileLoading, error: profileError } = usePerformanceProfile(primaryId);
  const { data: reports, isLoading: reportsLoading } = useCoachingReports(primaryId ?? undefined);
  const generateReport = useGenerateReport();

  function handleGenerate() {
    if (!primaryId || !profile) return;
    const matchIds = profile.recentMatches.slice(0, 5).map((m) => m.matchDbId);
    generateReport.mutate({ riotAccountId: primaryId, reportType: "session_review", matchIds });
  }

  if (accountsLoading) {
    return (
      <div className="p-8 text-text-muted text-sm">Loading accounts…</div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8">
        <h1 className="font-display text-2xl font-bold text-text">Welcome to LoL AI Coach</h1>
        <p className="text-sm text-text-muted">Connect your Riot account to get started.</p>
        <Link href="/settings/accounts">
          <Button>Connect Riot Account</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Dashboard</h1>
          {primaryAccount && (
            <p className="text-sm text-text-muted">
              {primaryAccount.gameName}#{primaryAccount.tagLine} · {primaryAccount.region.toUpperCase()}
            </p>
          )}
        </div>
        {accounts.length > 1 && (
          <select
            className="rounded-md border border-border bg-surface px-2 py-1 text-sm text-text"
            value={primaryId ?? ""}
            onChange={(e) => setSelectedAccountId(e.target.value)}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.gameName}#{a.tagLine}
              </option>
            ))}
          </select>
        )}
      </div>

      {profileError ? (
        <div className="rounded-lg bg-surface-2 p-4">
          <p className="text-sm text-text-muted">
            No match data found.{" "}
            <Link href="/settings/accounts" className="text-accent underline">
              Sync your account
            </Link>{" "}
            to see performance stats.
          </p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
              Performance
            </h2>
            <PerformanceSummaryCards profile={profile} isLoading={profileLoading} />
          </section>

          <PerformanceTrendChart matches={profile?.recentMatches} isLoading={profileLoading} />

          <section>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
              Recent Matches
            </h2>
            <RecentMatchList matches={profile?.recentMatches} isLoading={profileLoading} />
          </section>
        </>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-medium uppercase tracking-widest text-text-muted">
            Coaching Reports
          </h2>
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
