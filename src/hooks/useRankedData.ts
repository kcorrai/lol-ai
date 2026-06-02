"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { CurrentRank, LpSnapshot } from "@/domains/riot";

export type RankedData = {
  rank: CurrentRank | null;
  lpHistory: LpSnapshot[];
};

export function useRankedData(riotAccountId: string | null | undefined) {
  return useQuery<RankedData>({
    queryKey: ["ranked", riotAccountId],
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/ranked`),
    enabled: !!riotAccountId,
    staleTime: 5 * 60 * 1000,
  });
}
