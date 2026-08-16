"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { PlayerChampionAverages } from "@/domains/esports/comparison";

export interface YouVsProsResponse {
  averages: PlayerChampionAverages | null;
  source: "connected" | "riot-id";
  riotId?: string;
}

export interface YouVsProsRequest {
  champion: string;
  /** Omitted for a signed-in reader — the route resolves their connected account. */
  gameName?: string;
  tagLine?: string;
  region?: string;
}

/**
 * A reader's own line on a champion.
 *
 * A mutation rather than a query: nothing should be fetched until someone asks,
 * because the signed-out path reaches Riot for a stranger's account and a page
 * view is not a request to do that.
 */
export function useYouVsPros() {
  return useMutation<YouVsProsResponse, Error, YouVsProsRequest>({
    mutationFn: ({ champion, gameName, tagLine, region }) => {
      const params = new URLSearchParams({ champion });
      if (gameName) params.set("gameName", gameName);
      if (tagLine) params.set("tagLine", tagLine);
      if (region) params.set("region", region);
      return apiFetch<YouVsProsResponse>(`/api/esports/you-vs-pros?${params.toString()}`);
    },
  });
}
