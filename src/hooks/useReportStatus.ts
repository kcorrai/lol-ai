"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

export type ReportStatus = "pending" | "processing" | "complete" | "failed";

interface ReportStatusResponse {
  id: string;
  status: ReportStatus;
}

const ACTIVE_REPORT_STATES: ReportStatus[] = ["pending", "processing"];

export function useReportStatus(reportId: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<ReportStatusResponse>({
    queryKey: ["report-status", reportId],
    queryFn: () => apiFetch(`/api/coaching/reports/${reportId}/status`),
    enabled: !!reportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return false;
      return ACTIVE_REPORT_STATES.includes(status) ? 3000 : false;
    },
  });

  // When report is ready, invalidate the full report query so it loads automatically
  useEffect(() => {
    if (query.data?.status === "complete" && reportId) {
      queryClient.invalidateQueries({ queryKey: ["coaching-report", reportId] });
    }
  }, [query.data?.status, reportId, queryClient]);

  return query;
}

export function isReportGenerating(status: ReportStatus | undefined): boolean {
  return status !== undefined && ACTIVE_REPORT_STATES.includes(status);
}
