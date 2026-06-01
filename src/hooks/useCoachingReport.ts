"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

export function useCoachingReport(reportId: string | null | undefined) {
  return useQuery<CoachingReportDetail>({
    queryKey: ["coaching-report", reportId],
    queryFn: () => apiFetch(`/api/coaching/reports/${reportId}`),
    enabled: !!reportId,
    // Poll while pending/processing
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "pending" || status === "processing" ? 3_000 : false;
    },
  });
}
