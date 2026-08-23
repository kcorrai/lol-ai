"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { MatchStory } from "@/domains/match";

export function useMatchStory(matchId: string | null | undefined) {
  return useQuery<MatchStory>({
    queryKey: ["match-story", matchId],
    queryFn: () => apiFetch(`/api/match/${matchId}/story`),
    enabled: !!matchId,
    // A finished match's timeline never changes — the same reasoning as useLanePhase.
    staleTime: 60 * 60 * 1000,
    // Unlike lane phase this endpoint does not 404 for a match with no timeline; it answers 200
    // with `hasTimeline: false`. A 404 here means the match is not the caller's, which retrying
    // will never fix.
    retry: false,
  });
}
