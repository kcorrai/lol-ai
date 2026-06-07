"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

export interface TiltAlert {
  id: string;
  message: string;
  streakLength: number;
  createdAt: string;
}

export function useTiltAlerts() {
  return useQuery<TiltAlert[]>({
    queryKey: ["tilt-alerts"],
    queryFn: () => apiFetch("/api/tilt/alerts"),
    staleTime: 2 * 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useAcknowledgeTiltAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (alertId: string) =>
      apiFetch("/api/tilt/acknowledge", {
        method: "POST",
        body: JSON.stringify({ alertId }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tilt-alerts"] });
    },
  });
}
