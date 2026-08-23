"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ChampionPoolEntry } from "@/domains/champions/services/championStatsService";

export function useChampionPool(riotAccountId: string | null | undefined, minGames = 3) {
  return useQuery<ChampionPoolEntry[]>({
    queryKey: ["champion-pool", riotAccountId, minGames],
    queryFn: () => apiFetch(`/api/champions?riotAccountId=${riotAccountId}&minGames=${minGames}`),
    enabled: !!riotAccountId,
    staleTime: 10 * 60 * 1000,
  });
}
