"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { DraftInput, DraftAnalysis } from "@/domains/draft/types/draft.types";

export function useDraftAnalysis() {
  const mutation = useMutation<DraftAnalysis, Error, DraftInput>({
    mutationFn: (input) =>
      apiFetch<DraftAnalysis>("/api/draft/analyze", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  });

  return {
    analyze: mutation.mutate,
    data: mutation.data,
    isLoading: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    reset: mutation.reset,
  };
}
