"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { MatchupCell } from "@/domains/analysis/services/matchupService";

interface GuideResponse {
  guide: string;
  cacheHit: boolean;
}

export function useMatchupGuide(cell: MatchupCell | null) {
  return useQuery<GuideResponse>({
    queryKey: ["matchup-guide", cell?.playerChampion, cell?.opponentChampion],
    queryFn: () =>
      apiFetch("/api/analysis/matchup-guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerChampion: cell!.playerChampion,
          opponentChampion: cell!.opponentChampion,
          wins: cell!.wins,
          losses: cell!.losses,
          avgKda: cell!.avgKda,
        }),
      }),
    enabled: cell !== null,
    staleTime: 7 * 24 * 60_000, // 7 days — matches server cache
  });
}
