"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

interface GenerateReportParams {
  riotAccountId: string;
  reportType: "session_review" | "champion_focus" | "climb_roadmap";
  matchIds: string[];
  focusArea?: string;
}

interface GenerateReportResult {
  reportId: string;
  status: string;
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation<GenerateReportResult, Error, GenerateReportParams>({
    mutationFn: (params) =>
      apiFetch("/api/coaching/generate", {
        method: "POST",
        body: JSON.stringify(params),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["coaching-reports", variables.riotAccountId],
      });
    },
  });
}
