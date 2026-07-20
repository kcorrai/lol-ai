"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DailyMomentum } from "@/domains/analysis/services/dailyMomentumService";

export function useDailyMomentum(riotAccountId: string | null | undefined, days = 30) {
  return useQuery<DailyMomentum>({
    queryKey: ["daily-momentum", riotAccountId, days],
    queryFn: () => apiFetch(`/api/analysis/daily-momentum?riotAccountId=${riotAccountId}&days=${days}`),
    enabled: !!riotAccountId,
    staleTime: 15 * 60 * 1000,
  });
}
