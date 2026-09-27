"use client";

import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { RefreshResult } from "@/domains/riot/services/preview/profileRefresh";

export interface ProfileTarget {
  region: string;
  gameName: string;
  tagLine: string;
}

/** Ask for a fresh read of a public profile; the page re-renders from the new cache entry. */
export function useRefreshPublicProfile() {
  return useMutation<RefreshResult, Error, ProfileTarget>({
    mutationFn: (target) =>
      apiFetch<RefreshResult>("/api/public/profile/refresh", {
        method: "POST",
        body: JSON.stringify(target),
      }),
  });
}
