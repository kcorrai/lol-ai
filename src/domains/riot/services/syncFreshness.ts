import { prisma } from "@/lib/db/prisma";
import { dispatchOrRunInProcess } from "@/lib/inngest/dispatch";
import { runSyncWithStatus } from "@/domains/riot/services/matchSyncService";
import type { MatchSyncPayload } from "@/inngest/functions/matchSync";

// Ask for a sync without waiting for one.
//
// Match sync has always been driven by someone opening the dashboard
// (`useAutoSync`) plus the daily rank cron. That is fine for a page a player is
// looking at, and useless for a stream overlay: the creator is in a game, not on
// our site, and an overlay showing yesterday's LP is worse than no overlay.
//
// This is called from a public, key-authenticated endpoint, so it never blocks
// the response and never waits for a result. Three things keep it from becoming
// a way to hammer Riot: the caller must hold a valid overlay key, the caller
// rate-limits per key, and `matchSyncWorker` already carries
// `concurrency: { limit: 1, key: "event.data.riotAccountId" }` so a queue of
// requests for one account collapses to one run.

/** How stale an account may be before a poll asks for a refresh. */
export const OVERLAY_SYNC_STALE_MS = 3 * 60 * 1000;

/**
 * A sync that started but never finished. Past this the previous run is treated
 * as dead rather than in progress — otherwise one crashed sync would freeze the
 * overlay permanently.
 */
const STUCK_MS = 5 * 60 * 1000;

/**
 * The least time between two sync attempts, whatever became of the first.
 *
 * Freshness alone was measured from the last *successful* sync, so a sync that failed — Riot
 * rate limiting us, most likely — left the account exactly as stale as before, and the next
 * dashboard visit or overlay poll started another one straight away. Every visitor then retried
 * into the limit that caused the failure. Counting from the last attempt breaks that loop.
 */
export const SYNC_ATTEMPT_COOLDOWN_MS = 2 * 60 * 1000;

export interface SyncFreshnessResult {
  requested: boolean;
  /** Why nothing was started; absent when a sync was requested. */
  reason?: "missing" | "in-progress" | "recent";
  /** The account's sync status as it was read, for a caller that reports it. */
  status?: string;
}

export async function requestSyncIfStale(
  riotAccountId: string,
  userId: string,
  now: Date = new Date(),
  staleMs: number = OVERLAY_SYNC_STALE_MS
): Promise<SyncFreshnessResult> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { lastSyncedAt: true, syncStatus: true, syncStartedAt: true },
  });
  if (!account) return { requested: false, reason: "missing" };

  const inProgress = account.syncStatus === "RUNNING" || account.syncStatus === "PENDING";
  const startedMs = account.syncStartedAt?.getTime() ?? 0;
  const isStuck = now.getTime() - startedMs > STUCK_MS;
  if (inProgress && !isStuck) {
    return { requested: false, reason: "in-progress", status: account.syncStatus };
  }

  const syncedMs = account.lastSyncedAt?.getTime() ?? 0;
  const attemptedRecently = now.getTime() - startedMs < SYNC_ATTEMPT_COOLDOWN_MS;
  if (now.getTime() - syncedMs < staleMs || attemptedRecently) {
    return { requested: false, reason: "recent", status: account.syncStatus };
  }

  await prisma.riotAccount.update({
    where: { id: riotAccountId },
    data: { syncStatus: "PENDING", syncStartedAt: now, lastSyncError: null },
  });

  await dispatchOrRunInProcess(
    { name: "riot/sync.requested", data: { riotAccountId, userId } satisfies MatchSyncPayload },
    () => runSyncWithStatus(riotAccountId, userId)
  );

  return { requested: true };
}
