"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ApplicationRow } from "@/domains/marketplace";

const KEY = ["admin", "coaches"];

export type CoachQueueStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

interface QueueData {
  applications: ApplicationRow[];
  /** Always the PENDING count, whatever tab is open — it drives the nav badge. */
  pending: number;
}

export function useCoachQueue(status: CoachQueueStatus) {
  return useQuery<QueueData>({
    queryKey: [...KEY, status],
    queryFn: () => apiFetch<QueueData>(`/api/admin/coaches?status=${status}`),
    staleTime: 15_000,
  });
}

export type CoachDecision =
  | { coachProfileId: string; decision: "approve" }
  | { coachProfileId: string; decision: "reject" | "suspend" | "reinstate"; note: string };

export function useDecideCoach() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ coachProfileId, ...body }: CoachDecision) =>
      apiFetch<{ decided: string; slug: string | null }>(
        `/api/admin/coaches/${coachProfileId}`,
        { method: "PATCH", body: JSON.stringify(body) }
      ),
    // Every tab, not just the open one: a decision moves a row from one queue
    // to another, so leaving the others cached shows the coach in two places.
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
