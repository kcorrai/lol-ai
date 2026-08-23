import { useInfiniteQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { PublicMatchesResponse } from "@/types/publicMatches";

export interface PublicMatchesQuery {
  region: string;
  gameName: string;
  tagLine: string;
  /** How many rows the server already rendered — the offset the first extra page starts at. */
  serverRendered: number;
  /** Flipped by the first "load more"; until then this hook makes no request at all. */
  enabled: boolean;
}

/**
 * The pages of a public profile's match list past the server-rendered first one.
 *
 * Infinite rather than a plain query keyed on an offset: "load more" has to *accumulate*, and a
 * single query would replace page two with page three and silently shorten the list. The opening
 * rows stay server-rendered so the profile is complete for a crawler with no JavaScript, which
 * is why this starts at `serverRendered` rather than zero.
 */
export function usePublicMatches({
  region,
  gameName,
  tagLine,
  serverRendered,
  enabled,
}: PublicMatchesQuery) {
  return useInfiniteQuery({
    queryKey: ["public-matches", region, gameName, tagLine],
    enabled,
    initialPageParam: serverRendered,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams({
        region,
        gameName,
        tagLine,
        start: String(pageParam),
      });
      return apiFetch<PublicMatchesResponse>(`/api/public/profile/matches?${params}`);
    },
    getNextPageParam: (lastPage) => lastPage.nextStart ?? undefined,
    // Each page sits behind a day-long cache in front of Riot, so re-asking inside one session
    // buys nothing.
    staleTime: 60 * 60 * 1000,
  });
}
