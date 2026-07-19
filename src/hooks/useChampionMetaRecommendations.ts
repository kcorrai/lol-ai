"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { MetaRecommendation } from "@/domains/analysis/services/metaRecommendationService";

export function useChampionMetaRecommendations(riotAccountId: string | null | undefined) {
  return useQuery<MetaRecommendation[]>({
    queryKey: ["champion-meta-recommendations", riotAccountId],
    queryFn: () => apiFetch(`/api/recommendations/champion-meta?riotAccountId=${riotAccountId}`),
    enabled: !!riotAccountId,
    staleTime: 30 * 60 * 1000,
  });
}
