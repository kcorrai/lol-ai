"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { MatchupMatrix } from "@/domains/analysis/services/matchupService";

export function useMatchupMatrix(riotAccountId: string | null | undefined, position?: string) {
  const params = new URLSearchParams({ riotAccountId: riotAccountId ?? "" });
  if (position) params.set("position", position);

  return useQuery<MatchupMatrix>({
    queryKey: ["matchup-matrix", riotAccountId, position ?? "all"],
    queryFn: () => apiFetch(`/api/analysis/matchup-matrix?${params.toString()}`),
    enabled: !!riotAccountId,
    staleTime: 6 * 60_000, // 6 min — real cache is 6h server-side
  });
}
