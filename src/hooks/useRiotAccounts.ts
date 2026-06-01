"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import type { ConnectedAccount } from "@/domains/riot/services/accountService";

export function useRiotAccounts() {
  return useQuery<ConnectedAccount[]>({
    queryKey: ["riot-accounts"],
    queryFn: () => apiFetch("/api/riot/accounts"),
  });
}
