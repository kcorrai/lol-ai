"use client";

import Link from "next/link";
import { BarChart2, TrendingUp, Swords, Clock, ChevronRight } from "lucide-react";
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

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  processing: "Processing",
  complete: "Complete",
  failed: "Failed",
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; glow: string }> = {
  session_review: { icon: BarChart2,  color: "text-accent",  bg: "bg-accent/15",  glow: "rgba(200,155,60,0.12)" },
  champion_focus: { icon: Swords,     color: "text-warning", bg: "bg-warning/15", glow: "rgba(234,179,8,0.10)" },
  climb_roadmap:  { icon: TrendingUp, color: "text-success", bg: "bg-success/15", glow: "rgba(74,222,128,0.10)" },
};

const REPORT_TYPE_LABEL: Record<string, string> = {
  session_review: "Session Review",
  champion_focus: "Champion Focus",
  climb_roadmap:  "Climb Roadmap",
};

function reportTitle(report: ReportSummary): string {
  if (report.reportType === "champion_focus" && report.focusArea) {
    return `${report.focusArea} Focus`;
  }
  return REPORT_TYPE_LABEL[report.reportType] ?? report.reportType;
}

function ReportRow({ report }: { report: ReportSummary }) {
  const date = new Date(report.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  const isComplete = report.status === "complete";
  const cfg = TYPE_CONFIG[report.reportType] ?? TYPE_CONFIG.session_review!;
  const Icon = cfg.icon;

  const inner = (
    <div
      className="group flex items-center gap-3 rounded-xl border border-border bg-surface p-4 transition-all duration-200 hover:border-accent/30"
      style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${cfg.glow}, inset 0 1px 0 rgba(255,255,255,0.04)`; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.03)"; }}
    >
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
          <p className="mt-1 truncate text-xs text-text-muted/80">{report.summary}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Badge variant={STATUS_BADGE[report.status] ?? "default"} className="text-xs">
          {STATUS_LABEL[report.status] ?? report.status}
        </Badge>
        {isComplete && (
          <ChevronRight className="h-4 w-4 text-text-muted/40 transition-colors group-hover:text-accent" />
        )}
      </div>
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
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!reports || reports.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border bg-surface/50 py-8 text-center text-sm text-text-muted">
        No reports yet. Create your first coaching report above.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {reports.map((r) => (
        <ReportRow key={r.reportId} report={r} />
      ))}
      {hasNextPage && (
        <Button variant="secondary" size="sm" className="mt-2 w-full" onClick={onLoadMore} disabled={isFetchingNextPage}>
          {isFetchingNextPage ? "Loading…" : "Show more"}
        </Button>
      )}
    </div>
  );
}
