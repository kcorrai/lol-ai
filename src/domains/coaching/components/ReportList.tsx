"use client";

import Link from "next/link";
import { BarChart2, TrendingUp, Swords, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ReportSummary } from "@/domains/coaching/services/reportService";

const STATUS_BADGE: Record<string, "default" | "secondary" | "success" | "destructive" | "warning"> = {
  pending: "warning",
  processing: "secondary",
  complete: "success",
  failed: "destructive",
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  session_review: { icon: BarChart2, color: "text-accent", bg: "bg-accent/15" },
  champion_focus: { icon: Swords, color: "text-warning", bg: "bg-warning/15" },
  climb_roadmap: { icon: TrendingUp, color: "text-success", bg: "bg-success/15" },
};

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Session Review",
  champion_focus: "Champion Focus",
  climb_roadmap: "Climb Roadmap",
};

function reportTitle(report: ReportSummary): string {
  if (report.reportType === "champion_focus" && report.focusArea) {
    return `${report.focusArea} Focus`;
  }
  return REPORT_TYPE_LABEL[report.reportType] ?? report.reportType;
}

function ReportRow({ report }: { report: ReportSummary }) {
  const date = new Date(report.createdAt).toLocaleDateString();
  const isComplete = report.status === "complete";
  const cfg = TYPE_CONFIG[report.reportType] ?? TYPE_CONFIG.session_review!;
  const Icon = cfg.icon;

  const inner = (
    <div className="group flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-3 transition-all hover:border-accent/40 hover:bg-surface-2/80">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.bg}`}>
        <Icon className={`h-5 w-5 ${cfg.color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text">{reportTitle(report)}</p>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-muted">
          <Clock className="h-3 w-3 shrink-0" />
          <span>{date}</span>
          <span>·</span>
          <span>{report.matchesAnalyzed} matches</span>
        </div>
        {report.summary && (
          <p className="mt-1 truncate text-xs text-text-muted">{report.summary}</p>
        )}
      </div>
      <Badge variant={STATUS_BADGE[report.status] ?? "default"} className="shrink-0 text-xs">
        {report.status}
      </Badge>
    </div>
  );

  return isComplete ? <Link href={`/coaching/${report.reportId}`}>{inner}</Link> : <div>{inner}</div>;
}

interface Props {
  reports: ReportSummary[] | undefined;
  isLoading: boolean;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
}

export function ReportList({ reports, isLoading, hasNextPage, isFetchingNextPage, onLoadMore }: Props) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return <p className="text-sm text-text-muted">No reports yet. Generate your first coaching report above.</p>;
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <ReportRow key={r.reportId} report={r} />
      ))}
      {hasNextPage && (
        <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={onLoadMore} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}
    </div>
  );
}
