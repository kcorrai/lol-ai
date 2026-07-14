"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { Download, Mic } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { CoachingReportDetail } from "@/domains/coaching/components/CoachingReportDetail";
import { VoiceCoachPanel } from "@/domains/coaching/components/VoiceCoachPanel";
import { ReportRating } from "@/domains/coaching/components/ReportRating";
import { ShareReportButton } from "@/domains/coaching/components/ShareReportButton";
import { useCoachingReport } from "@/hooks/useCoachingReport";
import { useSubscription } from "@/hooks/useSubscription";

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Session Review",
  champion_focus: "Champion Focus",
  climb_roadmap: "Climb Roadmap",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  complete: "Complete",
  failed: "Failed",
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
  const [voiceOpen, setVoiceOpen] = useState(false);

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  if (isLoading) return <PageSkeleton />;

  if (error || !report) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <ErrorState
          title="Report not found"
          message={
            error?.message ?? "This report doesn't exist or you don't have access to it."
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
        subtitle={`${new Date(report.createdAt).toLocaleString("en-US")} · ${report.matchesAnalyzed.length} matches`}
        backHref="/coaching"
        backLabel="Reports"
        action={
          <Badge variant={STATUS_VARIANT[report.status] ?? "default"}>
            {STATUS_LABEL[report.status] ?? report.status}
          </Badge>
        }
      />

      {isPending && (
        <div className="flex flex-col items-center justify-center rounded-lg bg-surface-2 py-12 text-center">
          <div className="mb-3 h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-text-muted">
            AI is analyzing the matches — this process takes approximately 15-30 seconds.
          </p>
        </div>
      )}

      {report.status === "failed" && (
        <ErrorState
          title="Could not create report"
          message="AI couldn't complete this report. Please create a new report."
        />
      )}

      {report.status === "complete" && (
        <>
          <CoachingReportDetail report={report} isPro={isPro} />

          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={`/api/coaching/reports/${report.id}/pdf`}
              download
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-accent/50 hover:bg-surface hover:text-text"
            >
              <Download className="h-4 w-4" />
              Download PDF
            </a>
            {isPro && (
              <Button
                variant="secondary"
                size="sm"
                className="gap-1.5"
                onClick={() => setVoiceOpen((o) => !o)}
              >
                <Mic className="h-4 w-4" />
                {voiceOpen ? "Close Voice Coach" : "Speak with Voice Coach"}
              </Button>
            )}
          </div>

          {voiceOpen && isPro && (
            <div className="mt-4 h-[480px]">
              <VoiceCoachPanel
                riotAccountId={report.riotAccountId}
                onClose={() => setVoiceOpen(false)}
              />
            </div>
          )}

          <ShareReportButton reportId={report.id} />
          <ReportRating reportId={report.id} currentRating={report.userRating} />
        </>
      )}
    </div>
  );
}
