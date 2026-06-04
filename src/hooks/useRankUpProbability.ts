"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { RankUpResult } from "@/domains/analysis/types/analysis.types";

export function useRankUpProbability(riotAccountId: string | null | undefined) {
  return useQuery<RankUpResult | null>({
    queryKey: ["rank-up", riotAccountId],
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/rank-up`),
    enabled: !!riotAccountId,
    staleTime: 10 * 60_000,
  });
}
