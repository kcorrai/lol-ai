"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { CoachingActionsCard } from "@/domains/coaching/components/CoachingActionsCard";
import { ReportList } from "@/domains/coaching/components/ReportList";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useCoachingReports } from "@/hooks/useCoachingReports";
import { useGenerateReport } from "@/hooks/useGenerateReport";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
      {children}
    </p>
  );
}

export default function CoachingPage() {
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
  const generateReport = useGenerateReport();

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

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-4xl p-6">
        <EmptyState
          icon={<Gamepad2 className="h-16 w-16" />}
          title="Riot Hesabı Bağlı Değil"
          description="Koçluk raporu oluşturmak için önce League of Legends hesabını bağla."
          action={
            <Link href="/settings/accounts">
              <Button size="lg">Hesap Bağla</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      <PageHeader
        title="AI Koç Raporları"
        subtitle="Son maçlarını analiz et, kişisel gelişim önerileri al."
      />

      <section>
        <SectionLabel>Yeni Rapor Oluştur</SectionLabel>
        <CoachingActionsCard
          onSessionReview={handleSessionReview}
          onClimbRoadmap={handleClimbRoadmap}
          isPending={generateReport.isPending}
          isDisabled={!profile || profileLoading}
        />
        {generateReport.isError && (
          <p className="mt-2 text-xs text-danger">{generateReport.error.message}</p>
        )}
      </section>

      <section>
        <SectionLabel>Raporlarım</SectionLabel>
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
