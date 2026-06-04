"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { WarmupData } from "@/domains/analysis/services/warmupService";

export function useWarmupStatus(riotAccountId: string | null | undefined) {
  return useQuery<WarmupData>({
    queryKey: ["warmup-status", riotAccountId],
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/warmup`),
    enabled: !!riotAccountId,
    staleTime: 5 * 60_000,
  });
}
