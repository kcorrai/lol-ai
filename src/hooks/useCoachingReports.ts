"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ReportSummary } from "@/domains/coaching/services/reportService";

export function useCoachingReports(riotAccountId?: string) {
  return useQuery<ReportSummary[]>({
    queryKey: ["coaching-reports", riotAccountId],
    queryFn: () => {
      const qs = riotAccountId ? `?riotAccountId=${riotAccountId}` : "";
      return apiFetch(`/api/coaching/reports${qs}`);
    },
    enabled: !!riotAccountId,
    // Poll every 3 seconds while any report is being processed
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasActive = data?.some((r) => r.status === "pending" || r.status === "processing");
      return hasActive ? 3_000 : false;
    },
  });
}
