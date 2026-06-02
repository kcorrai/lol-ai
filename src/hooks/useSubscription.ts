"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { SubscriptionInfo } from "@/lib/stripe/subscriptionService";

export function useSubscription() {
  return useQuery<SubscriptionInfo>({
    queryKey: ["subscription"],
    queryFn: () => apiFetch("/api/subscription"),
    staleTime: 60 * 1000,
  });
}
