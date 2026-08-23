"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { CurrentRank, LpSnapshot } from "@/domains/riot";

export type RankedData = {
  rank: CurrentRank | null;
  lpHistory: LpSnapshot[];
};

export type RankedQueue = "solo" | "flex";

export function useRankedData(
  riotAccountId: string | null | undefined,
  queue: RankedQueue = "solo"
) {
  return useQuery<RankedData>({
    queryKey: ["ranked", riotAccountId, queue],
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/ranked?queue=${queue}`),
    enabled: !!riotAccountId,
    staleTime: 5 * 60 * 1000,
  });
}
