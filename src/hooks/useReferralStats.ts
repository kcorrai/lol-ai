"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ReferralStats } from "@/domains/identity/services/referralService";

export function useReferralStats() {
  return useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: () => apiFetch("/api/referral/stats"),
    staleTime: 5 * 60_000,
  });
}
