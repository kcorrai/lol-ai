"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { BuildExplanation } from "@/domains/match";

export function useBuildExplanation(matchId: string, puuid: string | null) {
  const query = useQuery<BuildExplanation>({
    queryKey: ["build-explanation", matchId, puuid],
    queryFn: () =>
      apiFetch<BuildExplanation>(
        `/api/match/${matchId}/build-explanation?puuid=${puuid}`
      ),
    enabled: false,
    staleTime: 1000 * 60 * 60 * 24 * 30,
    retry: 1,
  });

  return {
    data: query.data,
    isLoading: query.isFetching,
    isError: query.isError,
    trigger: query.refetch,
  };
}
