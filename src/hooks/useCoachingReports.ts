"use client";

import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ReportPage } from "@/domains/coaching/services/reportService";

export function useCoachingReports(riotAccountId?: string) {
  return useInfiniteQuery<ReportPage>({
    queryKey: ["coaching-reports", riotAccountId],
    queryFn: ({ pageParam }) => {
      const qs = new URLSearchParams();
      if (riotAccountId) qs.set("riotAccountId", riotAccountId);
      if (pageParam) qs.set("cursor", pageParam as string);
      return apiFetch(`/api/coaching/reports?${qs}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    initialPageParam: undefined as string | undefined,
    enabled: !!riotAccountId,
    refetchInterval: (query) => {
      const hasActive = query.state.data?.pages.some((p) =>
        p.reports.some((r) => r.status === "pending" || r.status === "processing")
      );
      return hasActive ? 3_000 : false;
    },
  });
}
