"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DetectedHabit } from "@/domains/analysis/services/habitDetectionService";

interface HabitsResponse {
  habits: DetectedHabit[];
  total: number;
}

export function usePlayerHabits(riotAccountId: string | null | undefined) {
  return useQuery<HabitsResponse>({
    queryKey: ["player-habits", riotAccountId],
    queryFn: () => apiFetch(`/api/analysis/habits?riotAccountId=${riotAccountId}`),
    enabled: !!riotAccountId,
    staleTime: 30 * 60 * 1000,
  });
}
