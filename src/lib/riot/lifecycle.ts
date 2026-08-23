import { riotCache } from "@/lib/riot/cache";
import { logger } from "@/lib/utils/logger";

// ── Cache Key Factory ───────────────────────────────────────────────────────
//
// Centralised key definitions prevent ad-hoc string literals scattered across
// callers. Typo in a key = cache miss; wrong key = stale data served as fresh.
//
// Convention: riot:<resource>:<identifier>[:<region>]

export const CacheKeys = {
  summoner: (puuid: string) => `riot:summoner:${puuid}`,
  // The window is part of the key. Without it a request for one id and a request for a hundred
  // share an entry, so whichever ran first decides what the other one gets — which becomes an
  // outright bug the moment a caller pages (LA-69).
  matchIds: (puuid: string, region: string, count: number, start: number) =>
    `${CacheKeys.matchIdsPrefix(puuid, region)}${start}:${count}`,
  /** Everything cached for one account's history, whatever window it was asked for. */
  matchIdsPrefix: (puuid: string, region: string) => `riot:matchids:${puuid}:${region}:`,
  matchDetail: (matchId: string) => `riot:match:${matchId}`,
  matchTimeline: (matchId: string) => `riot:timeline:${matchId}`,
  rankedEntries: (summonerId: string, region: string) =>
    `riot:ranked:${summonerId}:${region}`,
  championMastery: (puuid: string, region: string) =>
    `riot:mastery:${puuid}:${region}`,
} as const;

// ── Staleness Detection ─────────────────────────────────────────────────────

// Returns true when the data is old enough that a refresh is warranted.
// Default: 5 minutes — balances freshness against rate-limit consumption.
export function isDataStale(
  lastSyncedAt: Date | null | undefined,
  maxAgeMinutes = 5
): boolean {
  if (!lastSyncedAt) return true;
  const ageMs = Date.now() - lastSyncedAt.getTime();
  return ageMs > maxAgeMinutes * 60 * 1000;
}

// ── Background Refresh ──────────────────────────────────────────────────────

// Fire-and-forget: returns immediately, runs refresh in background.
// Errors are logged but never surfaced to the caller — the caller already
// has the stale data and can render it; the refresh updates on next request.
export function backgroundRefresh(fn: () => Promise<void>): void {
  Promise.resolve()
    .then(fn)
    .catch((err: unknown) =>
      logger.error("[lifecycle] Background refresh failed", err)
    );
}

// ── Invalidation ───────────────────────────────────────────────────────────

// Bulk-deletes all cached data for one Riot account.
// Call this after a successful match sync so the next read fetches fresh data.
// match detail keys are NOT deleted — match data is immutable and can remain cached.
export async function invalidateAccountCache(
  puuid: string,
  summonerId: string,
  region: string
): Promise<void> {
  await Promise.all([
    riotCache.del(CacheKeys.summoner(puuid)),
    riotCache.delByPrefix(CacheKeys.matchIdsPrefix(puuid, region)),
    riotCache.del(CacheKeys.rankedEntries(summonerId, region)),
    riotCache.del(CacheKeys.championMastery(puuid, region)),
  ]);
}
