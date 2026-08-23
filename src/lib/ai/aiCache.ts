import { createHash } from "crypto";
import { prisma } from "@/lib/db/prisma";
import {
  redisCacheGet,
  redisCacheSet,
  redisCacheDelete,
  redisCacheDeleteMany,
} from "@/lib/cache/redisCache";

const SECONDS_PER_DAY = 24 * 60 * 60;

// Entries at or beyond this TTL are not caches, they are durability fallbacks,
// and they stay in Postgres (TASK-293, ADR-014). Every other TTL in the codebase
// is 30 days or less; the only ones above the line are the `:last-good` snapshot
// rows written with SNAPSHOT_TTL_DAYS = 365, "effectively permanent fallback".
//
// The distinction is not pedantry. A last-good row is read precisely when op.gg
// is down — the one moment its absence would be felt — and Redis evicts under
// memory pressure while Postgres does not. It is also cheap to leave behind: it
// is written twice a day and read only during an outage, so it contributes
// essentially nothing to steady-state transfer.
const DURABLE_TTL_DAYS = 90;

export async function getCached(cacheKey: string): Promise<unknown | null> {
  // Redis first. A miss here is also what an unconfigured or unreachable Redis
  // looks like, so the Postgres read below stays on the path — which is what
  // makes entries written before TASK-293 keep working without a backfill.
  const cached = await redisCacheGet(cacheKey);
  if (cached !== null) return cached;

  // Projected: the row also carries id/type/hitCount/createdAt, and `content`
  // here can be a multi-hundred-KB meta snapshot. Every byte crosses the network
  // from Neon, so only the two fields the caller needs are selected (TASK-282).
  const entry = await prisma.aiCache.findUnique({
    where: { cacheKey },
    select: { content: true, expiresAt: true },
  });
  if (!entry) return null;
  if (entry.expiresAt < new Date()) return null;

  // Deliberately no hitCount increment. It used to fire on every read, which
  // turned each cache *hit* into an extra write round trip — the exact opposite
  // of what a cache is for, and a meaningful slice of the egress that exhausted
  // the Neon transfer quota.
  return entry.content;
}

export async function setCached(
  cacheKey: string,
  type: string,
  content: unknown,
  ttlDays: number
): Promise<void> {
  if (ttlDays < DURABLE_TTL_DAYS) {
    const stored = await redisCacheSet(cacheKey, content, ttlDays * SECONDS_PER_DAY);
    // Only fall through when Redis could not take it. Writing to both would put
    // back the transfer this task removes, and the Postgres copy would then
    // outlive the Redis one and be served stale by the fallback read above.
    if (stored) return;
  }

  // Millisecond-based so sub-day TTLs (e.g. 0.5 for a 12h cache) are honoured.
  const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);

  await prisma.aiCache.upsert({
    where: { cacheKey },
    create: { cacheKey, type, content: content as object, expiresAt },
    update: { content: content as object, expiresAt, hitCount: 0 },
  });
}

export async function deleteCached(cacheKey: string): Promise<void> {
  // Both stores: an entry can predate TASK-293, or have been written to Postgres
  // by the fallback above. Deleting one copy would leave the other to be found.
  await redisCacheDelete(cacheKey);
  await prisma.aiCache.deleteMany({ where: { cacheKey } }).catch(() => undefined);
}

/**
 * Drops a set of entries in two round trips rather than two per key.
 *
 * Busting a cache is rarely one key — the matchup matrix alone is six, one per position — and
 * deleteCached does a Redis command and a Postgres statement each time. Twelve round trips to
 * forget six things, where one DEL and one deleteMany say the same.
 */
export async function deleteCachedMany(cacheKeys: string[]): Promise<void> {
  if (cacheKeys.length === 0) return;
  await redisCacheDeleteMany(cacheKeys);
  await prisma.aiCache
    .deleteMany({ where: { cacheKey: { in: cacheKeys } } })
    .catch(() => undefined);
}

export function buildCacheKey(type: string, inputs: Record<string, string>): string {
  // Sort keys so key-order differences produce the same hash
  const sorted = Object.keys(inputs)
    .sort()
    .reduce<Record<string, string>>((acc, k) => {
      acc[k] = inputs[k].toLowerCase().trim();
      return acc;
    }, {});

  const payload = `${type}:${JSON.stringify(sorted)}`;
  return createHash("sha256").update(payload).digest("hex");
}
