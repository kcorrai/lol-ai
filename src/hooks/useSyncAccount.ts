"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

interface SyncResult {
  status: "synced" | "fresh";
  newMatches?: number;
  skipped?: number;
  errors?: string[];
}

export function useSyncAccount() {
  const queryClient = useQueryClient();

  return useMutation<SyncResult, Error, string>({
    mutationFn: (riotAccountId) =>
      apiFetch(`/api/riot/${riotAccountId}/sync`, { method: "POST" }),
    onSuccess: (_, riotAccountId) => {
      queryClient.invalidateQueries({ queryKey: ["riot-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["performance-profile", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["match-history", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["champion-pool", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["matchup-matrix", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["ranked-history", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["patch-impact", riotAccountId] });
    },
  });
}
