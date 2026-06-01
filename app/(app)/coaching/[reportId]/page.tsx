"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CoachingReportDetail } from "@/domains/coaching/components/CoachingReportDetail";
import { useCoachingReport } from "@/hooks/useCoachingReport";

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Session Review",
  champion_focus: "Champion Focus",
  climb_roadmap: "Climb Roadmap",
};

export default function ReportDetailPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const { data: report, isLoading, error } = useCoachingReport(reportId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8">
        <p className="text-sm text-danger">{error?.message ?? "Report not found."}</p>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm">← Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const isPending = report.status === "pending" || report.status === "processing";

  return (
    <div className="mx-auto max-w-3xl space-y-5 p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="text-xs text-text-muted hover:text-text">
            ← Dashboard
          </Link>
          <h1 className="mt-1 font-display text-2xl font-bold text-text">
            {REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
          </h1>
          <p className="text-xs text-text-muted">
            {new Date(report.createdAt).toLocaleString()} ·{" "}
            {report.matchesAnalyzed.length} matches analyzed
            {report.aiModelUsed && ` · ${report.aiModelUsed}`}
          </p>
        </div>
        <Badge
          variant={
            report.status === "complete"
              ? "success"
              : report.status === "failed"
                ? "destructive"
                : "warning"
          }
        >
          {report.status}
        </Badge>
      </div>

      {isPending && (
        <div className="rounded-lg bg-surface-2 p-6 text-center">
          <div className="mx-auto mb-3 h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <p className="text-sm text-text-muted">
            AI is analyzing your matches… this takes about 15–30 seconds.
          </p>
        </div>
      )}

      {report.status === "failed" && (
        <div className="rounded-lg bg-danger/10 p-4">
          <p className="text-sm text-danger">
            Report generation failed. Please try generating a new report.
          </p>
        </div>
      )}

      {report.status === "complete" && <CoachingReportDetail report={report} />}
    </div>
  );
}
