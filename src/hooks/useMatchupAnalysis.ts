"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { MatchupAnalysis } from "@/domains/matchup/types/matchup.types";
import type { Position } from "@/types/common.types";

interface AnalyzeParams {
  champion: string;
  opponent: string;
  role: Position;
}

function matchupQueryKey(p: AnalyzeParams) {
  return ["matchup", p.champion, p.opponent, p.role] as const;
}

export function useMatchupAnalysis() {
  const queryClient = useQueryClient();

  const mutation = useMutation<MatchupAnalysis, Error, AnalyzeParams>({
    mutationFn: async (params) => {
      const cached = queryClient.getQueryData<MatchupAnalysis>(
        matchupQueryKey(params)
      );
      if (cached) return cached;

      return apiFetch<MatchupAnalysis>("/api/matchup/analyze", {
        method: "POST",
        body: JSON.stringify(params),
      });
    },
    onSuccess: (data, params) => {
      queryClient.setQueryData(matchupQueryKey(params), data);
    },
  });

  return {
    analyze: mutation.mutate,
    data: mutation.data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
