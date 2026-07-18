"use client";

import { useState } from "react";
import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { CoachingActionsCard } from "@/domains/coaching/components/CoachingActionsCard";
import { ReportList } from "@/domains/coaching/components/ReportList";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useCoachingReports } from "@/hooks/useCoachingReports";
import { useGenerateReport } from "@/hooks/useGenerateReport";
import { FetchError } from "@/lib/api/fetcher";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
      {children}
    </p>
  );
}

const UPGRADE_ERROR_CODES = new Set([
  "REPORT_LIMIT_REACHED",
  "DAILY_REPORT_LIMIT_REACHED",
  "PRO_REQUIRED",
]);

export default function CoachingPage() {
  const [upgradeReason, setUpgradeReason] = useState<string | null>(null);
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const primaryId = accounts?.[0]?.id ?? null;
  const { data: profile, isLoading: profileLoading } = usePerformanceProfile(primaryId);
  const {
    data: reportsData,
    isLoading: reportsLoading,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useCoachingReports(primaryId ?? undefined);
  const generateReport = useGenerateReport({
    onError: (err) => {
      if (err instanceof FetchError && UPGRADE_ERROR_CODES.has(err.errorCode ?? "")) {
        setUpgradeReason(err.errorCode ?? "PRO_REQUIRED");
      }
    },
  });

  function handleSessionReview() {
    if (!primaryId || !profile) return;
    const matchIds = profile.recentMatches.slice(0, 5).map((m) => m.matchDbId);
    generateReport.mutate({ riotAccountId: primaryId, reportType: "session_review", matchIds });
  }

  function handleClimbRoadmap() {
    if (!primaryId || !profile) return;
    const matchIds = profile.recentMatches.slice(0, 10).map((m) => m.matchDbId);
    generateReport.mutate({ riotAccountId: primaryId, reportType: "climb_roadmap", matchIds });
  }

  function handleAramReview() {
    if (!primaryId || !profile) return;
    const aramMatchIds = profile.recentMatches
      .filter((m) => m.queueType === "ARAM")
      .slice(0, 5)
      .map((m) => m.matchDbId);
    if (aramMatchIds.length === 0) return;
    generateReport.mutate({ riotAccountId: primaryId, reportType: "session_review", matchIds: aramMatchIds });
  }

  const hasAramMatches = (profile?.recentMatches ?? []).some((m) => m.queueType === "ARAM");

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          icon={<Gamepad2 className="h-16 w-16" />}
          title="Riot Account Not Connected"
          description="Connect your League of Legends account first to create a coaching report."
          action={
            <Link href="/settings/accounts">
              <Button size="lg">Connect Account</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const showGenericError =
    generateReport.isError &&
    !(generateReport.error instanceof FetchError && UPGRADE_ERROR_CODES.has(generateReport.error.errorCode ?? ""));

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <UpgradeModal
        open={upgradeReason !== null}
        onClose={() => setUpgradeReason(null)}
        reason={upgradeReason ?? undefined}
      />

      <PageHeader
        title="AI Coach Reports"
        subtitle="Analyze your recent matches, get personalized improvement suggestions."
      />

      <section data-tour="generate-report">
        <SectionLabel>Generate New Report</SectionLabel>
        <CoachingActionsCard
          onSessionReview={handleSessionReview}
          onClimbRoadmap={handleClimbRoadmap}
          onAramReview={handleAramReview}
          hasAramMatches={hasAramMatches}
          isPending={generateReport.isPending}
          isDisabled={!profile || profileLoading}
        />
        {showGenericError && (
          <p className="mt-2 text-xs text-danger">{generateReport.error?.message}</p>
        )}
      </section>

      <section>
        <SectionLabel>My Reports</SectionLabel>
        <ReportList
          reports={reportsData?.pages.flatMap((p) => p.reports)}
          isLoading={reportsLoading}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onLoadMore={fetchNextPage}
        />
      </section>
    </div>
  );
}
