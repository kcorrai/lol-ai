"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";

export function usePerformanceProfile(riotAccountId: string | null | undefined) {
  return useQuery<PlayerPerformanceProfile>({
    queryKey: ["performance-profile", riotAccountId],
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/performance`),
    enabled: !!riotAccountId,
    staleTime: 5 * 60_000,
  });
}
