"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { PatchImpactResult } from "@/domains/analysis/services/patchService";

export function usePatchImpact(riotAccountId: string | null | undefined) {
  return useQuery<PatchImpactResult>({
    queryKey: ["patch-impact", riotAccountId],
    queryFn: () => apiFetch(`/api/patch/impact?riotAccountId=${riotAccountId}`),
    enabled: !!riotAccountId,
    staleTime: 60 * 60_000, // 1 hour — patch data doesn't change often
  });
}
