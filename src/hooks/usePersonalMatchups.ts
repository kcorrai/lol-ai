"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { PersonalMatchupReport } from "@/domains/counter";

export function usePersonalMatchups(
  riotAccountId: string | null | undefined,
  championId: number | null | undefined
) {
  return useQuery<PersonalMatchupReport>({
    queryKey: ["personal-matchups", riotAccountId, championId],
    queryFn: () =>
      apiFetch(
        `/api/champions/${championId}/matchups?riotAccountId=${riotAccountId}`
      ),
    enabled: !!riotAccountId && !!championId,
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
}
