"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { apiFetch } from "@/lib/api/fetcher";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

const TERMINAL_STATUSES = new Set(["complete", "failed"]);

export function useCoachingReport(reportId: string | null | undefined) {
  const queryClient = useQueryClient();
  const esRef = useRef<EventSource | null>(null);

  const query = useQuery<CoachingReportDetail>({
    queryKey: ["coaching-report", reportId],
    queryFn: () => apiFetch(`/api/coaching/reports/${reportId}`),
    enabled: !!reportId,
  });

  const currentStatus = query.data?.status;

  useEffect(() => {
    if (!reportId) return;
    if (currentStatus && TERMINAL_STATUSES.has(currentStatus)) return;

    // Close any existing connection before opening a new one
    esRef.current?.close();

    const es = new EventSource(`/api/coaching/reports/${reportId}/stream`);
    esRef.current = es;

    const handleStatus = (e: MessageEvent<string>) => {
      const payload = JSON.parse(e.data) as { status: string };
      queryClient.setQueryData<CoachingReportDetail>(
        ["coaching-report", reportId],
        (prev) => (prev ? { ...prev, status: payload.status as CoachingReportDetail["status"] } : prev)
      );
    };

    const handleDone = (e: MessageEvent<string>) => {
      const payload = JSON.parse(e.data) as { status: string };
      queryClient.setQueryData<CoachingReportDetail>(
        ["coaching-report", reportId],
        (prev) => (prev ? { ...prev, status: payload.status as CoachingReportDetail["status"] } : prev)
      );
      // Refresh full report data once complete
      if (payload.status === "complete") {
        void queryClient.invalidateQueries({ queryKey: ["coaching-report", reportId] });
      }
      es.close();
    };

    es.addEventListener("status", handleStatus);
    es.addEventListener("done", handleDone);
    es.onerror = () => {
      // On error close and fall back to no updates (full data already in cache)
      es.close();
    };

    return () => {
      es.close();
    };
  }, [reportId, currentStatus, queryClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      esRef.current?.close();
    };
  }, []);

  return query;
}
