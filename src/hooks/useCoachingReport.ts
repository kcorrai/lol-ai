"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

const POLLING_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

export function useCoachingReport(reportId: string | null | undefined) {
  return useQuery<CoachingReportDetail>({
    queryKey: ["coaching-report", reportId],
    queryFn: () => apiFetch(`/api/coaching/reports/${reportId}`),
    enabled: !!reportId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status !== "pending" && status !== "processing") return false;
      // Stop polling if the report has been in-flight for more than 2 minutes
      const updatedAt = query.state.dataUpdatedAt;
      if (updatedAt && Date.now() - updatedAt > POLLING_TIMEOUT_MS) return false;
      return 3_000;
    },
  });
}
