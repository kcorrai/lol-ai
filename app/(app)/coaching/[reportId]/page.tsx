"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ErrorState } from "@/components/ui/error-state";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { CoachingReportDetail } from "@/domains/coaching/components/CoachingReportDetail";
import { VoiceCoachPanel } from "@/domains/coaching/components/VoiceCoachPanel";
import { ReportRail } from "@/domains/coaching/components/report/ReportRail";
import { useCoachingReport } from "@/hooks/useCoachingReport";
import { useSubscription } from "@/hooks/useSubscription";
import { formatDateTime } from "@/lib/uiLocale";

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

export default function ReportDetailPage(): React.ReactElement {
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
          message={error?.message ?? "This report doesn't exist or you don't have access to it."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const isPending = report.status === "pending" || report.status === "processing";

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-6 md:px-8">
      <div className="mb-5 flex flex-wrap items-center gap-3.5 border-b border-line-1 pb-4">
        <Link
          href="/coaching"
          className="flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-label text-text-body transition-colors hover:text-accent"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          Reports
        </Link>
        <span className="h-4 w-px bg-line-2" />
        <span className="font-display text-sm font-bold uppercase tracking-[0.06em] text-text">
          {REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
        </span>
        <span className="hud-label text-[10.5px]">
          {formatDateTime(report.createdAt)} · {report.matchesAnalyzed.length}{" "}
          matches
        </span>
        <span className="ml-auto">
          <Badge variant={STATUS_VARIANT[report.status] ?? "default"}>
            {STATUS_LABEL[report.status] ?? report.status}
          </Badge>
        </span>
      </div>

      {isPending && (
        <div className="notch flex flex-col items-center justify-center border border-border bg-surface py-12 text-center">
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
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_328px]">
          <div className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-5">
            <CoachingReportDetail report={report} isPro={isPro} />

            {voiceOpen && isPro && (
              <div className="h-[480px]">
                <VoiceCoachPanel
                  riotAccountId={report.riotAccountId}
                  onClose={() => setVoiceOpen(false)}
                />
              </div>
            )}
          </div>

          <ReportRail
            report={report}
            isPro={isPro}
            voiceOpen={voiceOpen}
            onToggleVoice={() => setVoiceOpen((o) => !o)}
          />
        </div>
      )}
    </div>
  );
}
