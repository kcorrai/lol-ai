"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { TiltStatus } from "@/domains/analysis/services/tiltService";

export function useTiltStatus(riotAccountId: string | null | undefined) {
  return useQuery<TiltStatus | null>({
    queryKey: ["tilt-status", riotAccountId],
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/tilt`),
    enabled: !!riotAccountId,
    staleTime: 5 * 60_000,
  });
}
