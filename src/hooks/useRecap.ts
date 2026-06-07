"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { RecapData } from "@/domains/analysis/services/recapService";

export interface RecapRecord {
  id: string;
  userId: string;
  seasonLabel: string;
  shareToken: string;
  data: RecapData;
  generatedAt: string;
  isPublic: boolean;
}

export function useGenerateRecap() {
  const qc = useQueryClient();
  return useMutation<RecapRecord, Error, { riotAccountId: string }>({
    mutationFn: ({ riotAccountId }) =>
      apiFetch("/api/recap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riotAccountId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recap"] });
    },
  });
}
