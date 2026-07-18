"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

interface CompleteResult {
  completedAt: string;
}

// Marks the forced onboarding complete server-side (TASK-217). Completion is the single
// source of truth for the gate, so this is the only write the guided journey performs.
export function useCompleteOnboarding() {
  return useMutation<CompleteResult, Error>({
    mutationFn: () => apiFetch<CompleteResult>("/api/onboarding/complete", { method: "POST" }),
  });
}
