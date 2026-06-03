"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

interface RatingInput {
  reportId: string;
  rating: number;
  feedback?: string;
}

export function useSubmitRating() {
  const queryClient = useQueryClient();

  return useMutation<{ rated: boolean }, Error, RatingInput>({
    mutationFn: ({ reportId, rating, feedback }) =>
      apiFetch(`/api/coaching/reports/${reportId}/rating`, {
        method: "POST",
        body: JSON.stringify({ rating, feedback }),
      }),
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: ["coaching-report", reportId] });
    },
  });
}
