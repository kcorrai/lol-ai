"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ReportSummary } from "@/domains/coaching/services/reportService";

const STATUS_BADGE: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "warning",
  processing: "secondary",
  complete: "success",
  failed: "destructive",
};

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Session Review",
  champion_focus: "Champion Focus",
  climb_roadmap: "Climb Roadmap",
};

function ReportRow({ report }: { report: ReportSummary }) {
  const date = new Date(report.createdAt).toLocaleDateString();
  const isComplete = report.status === "complete";

  const inner = (
    <div className="flex items-center gap-3 rounded-lg bg-surface-2 px-3 py-2.5 transition-colors hover:bg-surface-2/80">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text">
          {REPORT_TYPE_LABEL[report.reportType] ?? report.reportType}
        </p>
        <p className="text-xs text-text-muted">
          {report.matchesAnalyzed} matches · {date}
        </p>
        {report.summary && (
          <p className="mt-0.5 truncate text-xs text-text-muted">{report.summary}</p>
        )}
      </div>
      <Badge variant={STATUS_BADGE[report.status] ?? "default"} className="shrink-0">
        {report.status}
      </Badge>
    </div>
  );

  return isComplete ? (
    <Link href={`/coaching/${report.reportId}`}>{inner}</Link>
  ) : (
    <div>{inner}</div>
  );
}

interface Props {
  reports: ReportSummary[] | undefined;
  isLoading: boolean;
}

export function ReportList({ reports, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No reports yet. Generate your first coaching report below.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {reports.map((r) => (
        <ReportRow key={r.reportId} report={r} />
      ))}
    </div>
  );
}
