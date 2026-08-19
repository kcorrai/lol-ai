"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { LanePhase } from "@/domains/match";

export function useLanePhase(matchId: string | null | undefined) {
  return useQuery<LanePhase>({
    queryKey: ["lane-phase", matchId],
    queryFn: () => apiFetch(`/api/match/${matchId}/lane-phase`),
    enabled: !!matchId,
    // A finished match's timeline never changes, so this is as static as data gets here.
    staleTime: 60 * 60 * 1000,
    // The endpoint answers 404 for a match captured before the timeline work shipped, which is
    // an expected outcome rather than a fault. Retrying it just delays the empty state.
    retry: false,
  });
}
