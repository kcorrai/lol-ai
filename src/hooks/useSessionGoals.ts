"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionGoalMetric } from "@prisma/client";
import { apiFetch } from "@/lib/api/fetcher";
import type { GoalProgress } from "@/domains/marketplace/services/sessionGoalService";

const key = (bookingId: string): string[] => ["marketplace", "goals", bookingId];

export function useSessionGoals(bookingId: string) {
  return useQuery<GoalProgress>({
    queryKey: key(bookingId),
    queryFn: () => apiFetch(`/api/bookings/${bookingId}/goals`),
    staleTime: 60_000,
  });
}

export function useSetSessionGoals(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (goals: Array<{ metric: SessionGoalMetric; target: number }>) =>
      apiFetch<{ ok: true }>(`/api/bookings/${bookingId}/goals`, {
        method: "PUT",
        body: JSON.stringify({ goals }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: key(bookingId) }),
  });
}
