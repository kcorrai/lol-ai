"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { SubscriptionInfo } from "@/lib/subscription/subscriptionService";

export function useSubscription() {
  const { status } = useSession();
  return useQuery<SubscriptionInfo>({
    queryKey: ["subscription"],
    queryFn: () => apiFetch("/api/subscription"),
    enabled: status === "authenticated",
    staleTime: 60 * 1000,
    gcTime: 10 * 60_000,
  });
}
