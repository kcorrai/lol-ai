"use client";

import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";

export type SyncStatus = "IDLE" | "PENDING" | "RUNNING" | "COMPLETED" | "FAILED";

interface SyncStatusResponse {
  status: SyncStatus;
  syncStartedAt: string | null;
  syncCompletedAt: string | null;
  lastSyncError: string | null;
  lastSyncedAt: string | null;
}

const ACTIVE_STATES: SyncStatus[] = ["PENDING", "RUNNING"];

export function useSyncStatus(riotAccountId: string | null | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery<SyncStatusResponse>({
    queryKey: ["sync-status", riotAccountId],
    queryFn: () => apiFetch(`/api/riot/${riotAccountId}/sync/status`),
    enabled: !!riotAccountId,
    // Poll every 2s while sync is active, stop when done
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (!status) return false;
      return ACTIVE_STATES.includes(status) ? 2000 : false;
    },
  });

  // Invalidate data queries when sync completes so UI refreshes with new matches
  useEffect(() => {
    if (query.data?.status === "COMPLETED" && riotAccountId) {
      queryClient.invalidateQueries({ queryKey: ["riot-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["performance-profile", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["match-history", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["champion-pool", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["ranked-history", riotAccountId] });
      queryClient.invalidateQueries({ queryKey: ["patch-impact", riotAccountId] });
    }
  }, [query.data?.status, riotAccountId, queryClient]);

  return query;
}

export function isSyncActive(status: SyncStatus | undefined): boolean {
  return status !== undefined && ACTIVE_STATES.includes(status);
}
