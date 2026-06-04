"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { CounterStats } from "@/domains/champions/services/counterPickService";

export function useCounterPicks(
  riotAccountId: string | null | undefined,
  champion: string | null | undefined
) {
  return useQuery<CounterStats | null>({
    queryKey: ["counter-picks", riotAccountId, champion],
    queryFn: () =>
      apiFetch(`/api/riot/${riotAccountId}/counters?champion=${encodeURIComponent(champion!)}`),
    enabled: !!riotAccountId && !!champion,
    staleTime: 15 * 60_000,
  });
}
