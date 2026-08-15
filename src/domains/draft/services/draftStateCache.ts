import { redisCacheDelete, redisCacheGet, redisCacheSet } from "@/lib/cache/redisCache";
import type { DraftSeriesRecord } from "./draftRecord";

// The read model behind ADR-016. Every mutation writes the whole record here, so
// a poll — of which there is roughly one per second per viewer — never reaches
// Postgres. Neon egress then scales with writes rather than with spectators,
// which is the failure TASK-282 was opened for.

const MAX_TTL_SECONDS = 7 * 24 * 60 * 60;

function cacheKey(code: string): string {
  return `draft:state:${code}`;
}

/** Seconds until the series expires, clamped so a stale row cannot pin a key. */
function ttlFor(record: DraftSeriesRecord, nowMs: number): number {
  const remaining = Math.floor((Date.parse(record.state.expiresAt) - nowMs) / 1000);
  return Math.min(MAX_TTL_SECONDS, Math.max(1, remaining));
}

export async function readCachedRecord(code: string): Promise<DraftSeriesRecord | null> {
  const value = await redisCacheGet(cacheKey(code));
  if (!value || typeof value !== "object") return null;
  const record = value as DraftSeriesRecord;
  // A record written by an older deploy may not carry every field. Treat a
  // partial hit as a miss rather than feeding half a state into the engine.
  if (!record.id || !record.state?.games || !record.gameIds) return null;
  return record;
}

export async function writeCachedRecord(
  record: DraftSeriesRecord,
  nowMs: number = Date.now()
): Promise<void> {
  await redisCacheSet(cacheKey(record.state.code), record, ttlFor(record, nowMs));
}

export async function invalidateCachedRecord(code: string): Promise<void> {
  await redisCacheDelete(cacheKey(code));
}
