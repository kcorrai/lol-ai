"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

interface OnboardingState {
  completed: boolean;
}

// Reads the current user's forced-onboarding completion flag (TASK-225). Used to gate the guide
// overlay on the public profile page, which is rendered outside the (app) shell.
export function useOnboardingState(enabled = true) {
  return useQuery<OnboardingState>({
    queryKey: ["onboarding-state"],
    queryFn: () => apiFetch<OnboardingState>("/api/onboarding/state"),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  });
}
