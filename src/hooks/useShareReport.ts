"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

interface ShareResult {
  shareToken: string;
  shareUrl: string;
}

export function useShareReport(reportId: string) {
  return useMutation<ShareResult, Error>({
    mutationFn: () =>
      apiFetch(`/api/coaching/reports/${reportId}/share`, { method: "POST" }),
  });
}
