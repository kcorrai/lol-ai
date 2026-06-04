"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { PlanWithProgress } from "@/domains/analysis/types/analysis.types";

function planKey(riotAccountId: string) {
  return ["improvement-plan", riotAccountId];
}

export function useImprovementPlan(riotAccountId: string | null | undefined) {
  return useQuery<PlanWithProgress | null>({
    queryKey: planKey(riotAccountId ?? ""),
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/plan`),
    enabled: !!riotAccountId,
    staleTime: 5 * 60_000,
  });
}

export function useGeneratePlan(riotAccountId: string | null | undefined) {
  const qc = useQueryClient();
  return useMutation<PlanWithProgress>({
    mutationFn: () =>
      apiFetch(`/api/riot/${riotAccountId}/plan`, { method: "POST" }),
    onSuccess: () => {
      if (riotAccountId) qc.invalidateQueries({ queryKey: planKey(riotAccountId) });
    },
  });
}
