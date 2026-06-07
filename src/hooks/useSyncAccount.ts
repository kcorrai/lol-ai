"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

interface SyncResponse {
  status: string;
  riotAccountId: string;
}

export function useSyncAccount() {
  const queryClient = useQueryClient();

  return useMutation<SyncResponse, Error, string>({
    mutationFn: (riotAccountId) =>
      apiFetch(`/api/riot/${riotAccountId}/sync`, { method: "POST" }),
    onSuccess: (_, riotAccountId) => {
      // Invalidate sync status so useSyncStatus starts polling immediately
      queryClient.invalidateQueries({ queryKey: ["sync-status", riotAccountId] });
    },
  });
}
