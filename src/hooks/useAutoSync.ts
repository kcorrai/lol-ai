"use client";

import { useEffect, useRef } from "react";
import { useSyncAccount } from "./useSyncAccount";
import { useSyncStatus, isSyncActive, type SyncStatus } from "./useSyncStatus";

// Re-pull matches automatically when the last sync is older than this. Keeps dashboard data current
// without the user pressing "Sync Now" (TASK-221).
export const AUTO_SYNC_STALE_MS = 30 * 60 * 1000;

// Pure decision — extracted so the staleness logic is unit-testable without React/timers.
export function shouldAutoSync(
  lastSyncedAt: string | Date | null | undefined,
  status: SyncStatus | undefined,
  now: number
): boolean {
  if (isSyncActive(status)) return false; // a sync is already running — don't stack another
  const last = lastSyncedAt ? new Date(lastSyncedAt).getTime() : 0; // never synced → always stale
  return now - last >= AUTO_SYNC_STALE_MS;
}

// Silently refreshes a stale primary account when the user lands on the dashboard. The manual
// "Sync Now" button stays; this just means most users never need it. Fires at most once per
// account per mount. `useSyncStatus` (also mounted here) invalidates data queries when the sync
// completes, so the dashboard updates with the new matches on its own.
export function useAutoSync(
  riotAccountId: string | null | undefined,
  lastSyncedAt: string | Date | null | undefined
): void {
  const sync = useSyncAccount();
  const { data: status } = useSyncStatus(riotAccountId);
  const firedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!riotAccountId || firedFor.current === riotAccountId) return;
    if (!shouldAutoSync(lastSyncedAt, status?.status, Date.now())) return;
    firedFor.current = riotAccountId;
    sync.mutate(riotAccountId);
  }, [riotAccountId, lastSyncedAt, status?.status, sync]);
}
