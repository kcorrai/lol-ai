"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { VodReviewDelivery } from "@/domains/marketplace";

export interface ReviewDraft {
  summary: string;
  sourceUrl?: string | null;
  annotations: {
    timestampSeconds: number;
    title: string;
    body: string;
    category: string;
  }[];
  publish?: boolean;
}

export function useVodReview(bookingId: string) {
  return useQuery<{ review: VodReviewDelivery | null }>({
    queryKey: ["marketplace", "review", bookingId],
    queryFn: () => apiFetch(`/api/bookings/${bookingId}/review`),
    staleTime: 15_000,
  });
}

export function useSaveVodReview(bookingId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (draft: ReviewDraft) =>
      apiFetch<{ review: VodReviewDelivery }>(`/api/bookings/${bookingId}/review`, {
        method: "PUT",
        body: JSON.stringify(draft),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["marketplace", "review", bookingId] });
      // Publishing usually goes with marking the booking delivered, so the
      // booking itself has to be re-read too.
      void qc.invalidateQueries({ queryKey: ["marketplace", "booking", bookingId] });
    },
  });
}
