"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ChampionMasteryScore } from "@/domains/champions/services/masteryScoreService";

export function useChampionMastery(
  riotAccountId: string | null | undefined,
  championId: number | null | undefined
) {
  return useQuery<ChampionMasteryScore>({
    queryKey: ["champion-mastery", riotAccountId, championId],
    queryFn: () =>
      apiFetch(
        `/api/champions/${championId}/mastery?riotAccountId=${riotAccountId}`
      ),
    enabled: !!riotAccountId && !!championId,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });
}
