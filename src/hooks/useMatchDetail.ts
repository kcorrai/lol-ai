"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { MatchDetail } from "@/domains/match";

export function useMatchDetail(matchId: string | null | undefined) {
  return useQuery<MatchDetail>({
    queryKey: ["match", matchId],
    queryFn: () => apiFetch(`/api/match/${matchId}`),
    enabled: !!matchId,
    staleTime: 10 * 60 * 1000,
  });
}
