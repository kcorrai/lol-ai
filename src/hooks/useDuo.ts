"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ActiveDuo, DuoCandidate } from "@/domains/analysis/services/duoService";

const HALF_HOUR = 30 * 60 * 1000;

export function useDuo(riotAccountId: string | null | undefined) {
  return useQuery<ActiveDuo | null>({
    queryKey: ["duo", riotAccountId],
    queryFn: () => apiFetch(`/api/duo?riotAccountId=${riotAccountId}`),
    enabled: !!riotAccountId,
    staleTime: HALF_HOUR,
  });
}

export function useDuoCandidates(riotAccountId: string | null | undefined, enabled = true) {
  return useQuery<DuoCandidate[]>({
    queryKey: ["duo-candidates", riotAccountId],
    queryFn: () => apiFetch(`/api/duo/candidates?riotAccountId=${riotAccountId}`),
    enabled: !!riotAccountId && enabled,
    staleTime: HALF_HOUR,
  });
}

/** Accepts either a picked candidate's puuid or a Riot ID the player typed. */
export function useSetDuo(riotAccountId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation<ActiveDuo, Error, { puuid?: string; riotId?: string }>({
    mutationFn: (input) =>
      apiFetch("/api/duo", {
        method: "POST",
        body: JSON.stringify({ riotAccountId, ...input }),
      }),
    onSuccess: () => invalidateDuo(queryClient, riotAccountId),
  });
}

export function useClearDuo(riotAccountId: string | null | undefined) {
  const queryClient = useQueryClient();

  return useMutation<{ cleared: boolean }, Error, void>({
    mutationFn: () => apiFetch(`/api/duo?riotAccountId=${riotAccountId}`, { method: "DELETE" }),
    onSuccess: () => invalidateDuo(queryClient, riotAccountId),
  });
}

// The momentum chart reads the duo too, so it has to refetch alongside the duo itself.
function invalidateDuo(
  queryClient: ReturnType<typeof useQueryClient>,
  riotAccountId: string | null | undefined,
) {
  queryClient.invalidateQueries({ queryKey: ["duo", riotAccountId] });
  queryClient.invalidateQueries({ queryKey: ["daily-momentum", riotAccountId] });
}
