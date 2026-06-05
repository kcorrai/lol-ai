"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { GeneralCounterResult } from "@/domains/counter/types/counter.types";
import type { Position } from "@/types/common.types";

export function useGeneralCounterPick(
  champion: string | null,
  role: Position | null
) {
  return useQuery<GeneralCounterResult>({
    queryKey: ["counter", "general", champion, role],
    queryFn: () =>
      apiFetch<GeneralCounterResult>(
        `/api/counter?champion=${encodeURIComponent(champion!)}&role=${role!}`
      ),
    enabled: !!champion && !!role,
    staleTime: 1000 * 60 * 60 * 24 * 7,
    gcTime: 1000 * 60 * 60 * 24 * 14,
    retry: 1,
  });
}
