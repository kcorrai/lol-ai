"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DetectedHabit } from "@/domains/analysis/services/habitDetectionService";

export function useHabits(riotAccountId: string | null | undefined) {
  return useQuery<DetectedHabit[]>({
    queryKey: ["habits", riotAccountId],
    queryFn: async () => {
      const res = await apiFetch<{ habits: DetectedHabit[] }>(`/api/riot/${riotAccountId}/habits`);
      return res.habits;
    },
    enabled: !!riotAccountId,
    staleTime: 5 * 60 * 1000,
  });
}
