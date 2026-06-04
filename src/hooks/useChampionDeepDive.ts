"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ChampionDeepDiveResult } from "@/domains/champions/services/championDeepDiveService";

export function useChampionDeepDive(
  riotAccountId: string | null | undefined,
  championName: string | null
) {
  return useQuery<ChampionDeepDiveResult | null>({
    queryKey: ["champion-deep-dive", riotAccountId, championName],
    queryFn: () =>
      apiFetch(
        `/api/riot/${riotAccountId}/champion-deep-dive?champion=${encodeURIComponent(championName!)}`
      ),
    enabled: !!riotAccountId && !!championName,
    staleTime: 60 * 60_000, // 1 hour — AI summary is cached 7 days
  });
}
