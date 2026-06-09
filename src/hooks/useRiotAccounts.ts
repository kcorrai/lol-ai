"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { apiFetch } from "@/lib/api/fetcher";
import type { ConnectedAccount } from "@/domains/riot/services/accountService";

export function useRiotAccounts() {
  const { status } = useSession();
  return useQuery<ConnectedAccount[]>({
    queryKey: ["riot-accounts"],
    queryFn: () => apiFetch("/api/riot/accounts"),
    enabled: status === "authenticated",
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
}
