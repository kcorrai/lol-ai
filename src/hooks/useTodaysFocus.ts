"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { FocusItem } from "@/domains/analysis/types/analysis.types";

export function useTodaysFocus(riotAccountId: string | null | undefined) {
  return useQuery<FocusItem | null>({
    queryKey: ["todays-focus", riotAccountId],
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/focus`),
    enabled: !!riotAccountId,
    staleTime: 10 * 60_000,
  });
}
