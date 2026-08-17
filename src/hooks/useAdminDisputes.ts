"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DisputeRow } from "@/domains/marketplace";

const KEY = ["admin", "disputes"];

export type DisputeQueueStatus = "OPEN" | "RESOLVED_REFUND" | "RESOLVED_RELEASE" | "REJECTED";

export function useDisputes(status: DisputeQueueStatus) {
  return useQuery<{ disputes: DisputeRow[] }>({
    queryKey: [...KEY, status],
    queryFn: () => apiFetch(`/api/admin/disputes?status=${status}`),
    staleTime: 15_000,
  });
}

export function useResolveDispute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      disputeId,
      ...body
    }: {
      disputeId: string;
      outcome: "refund" | "release";
      note: string;
    }) =>
      apiFetch<{ resolved: string }>(`/api/admin/disputes/${disputeId}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    // A decision moves the row between queues, so every tab has to be re-read.
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
