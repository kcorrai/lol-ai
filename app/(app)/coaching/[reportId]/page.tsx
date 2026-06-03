"use client";

import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { CoachingReportDetail } from "@/domains/coaching/components/CoachingReportDetail";
import { ReportRating } from "@/domains/coaching/components/ReportRating";
import { useCoachingReport } from "@/hooks/useCoachingReport";
import { useSubscription } from "@/hooks/useSubscription";

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Session Review",
  champion_focus: "Champion Focus",
  climb_roadmap: "Climb Roadmap",
};

const STATUS_VARIANT = {
  pending: "warning",
  processing: "warning",
  complete: "success",
  failed: "destructive",
} as const;

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { data: report, isLoading, error, refetch } = useCoachingReport(reportId);
  const { data: sub } = useSubscription();

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  if (isLoading) return <PageSkeleton />;

  if (error || !report) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState
          title="Report not found"
          message={
            error?.message ?? "This report does not exist or you don't have access to it."
          }
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isPending = report.status === "pending" || report.status === "processing";

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title={REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
        subtitle={`${new Date(report.createdAt).toLocaleString()} · ${report.matchesAnalyzed.length} matches${report.aiModelUsed ? ` · ${report.aiModelUsed}` : ""}`}
        backHref="/dashboard"
        backLabel="Dashboard"
        action={
          <Badge variant={STATUS_VARIANT[report.status] ?? "default"}>
            {report.status}
          </Badge>
        }
      />

      {isPending && (
        <div className="flex flex-col items-center justify-center rounded-lg bg-surface-2 py-12 text-center">
          <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-text-muted">
            AI is analyzing your matches — this takes about 15–30 seconds.
          </p>
        </div>
      )}

      {report.status === "failed" && (
        <ErrorState
          title="Report generation failed"
          message="The AI could not complete this report. Please generate a new one."
        />
      )}

      {report.status === "complete" && (
        <>
          <CoachingReportDetail report={report} isPro={isPro} />
          <ReportRating reportId={report.id} currentRating={report.userRating} />
        </>
      )}
    </div>
  );
}
