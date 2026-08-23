import type { z } from "zod";
import { fixturesEnabled } from "@/domains/esports/services/esportsFixtures";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { logger } from "@/lib/utils/logger";

// The fresh + never-expiring last-good discipline of ADR-016, and the TTL table
// it runs on. Split out of esportsApi when that file passed the 250-line limit:
// one module knows the feeds exist, this one knows how long their answers keep.

// setCached takes days, and most of what this section caches is measured in
// seconds or minutes. Expressing the conversion once keeps the TTL table
// readable instead of a column of magic fractions.
const days = (n: number): number => n;
const hours = (n: number): number => n / 24;
const minutes = (n: number): number => n / 1440;
const seconds = (n: number): number => n / 86_400;

/** Fresh-window TTLs per resource class — the ADR-016 table, in one place. */
export const TTL = {
  /** Live events change while you watch them. */
  live: seconds(30),
  /** Kickoff times shift and results land continuously. */
  schedule: minutes(15),
  /** Moves after each match day. */
  standings: hours(1),
  /** A league's split list gains an entry at most once a split. */
  tournaments: hours(1),
  /** Leagues, teams, rosters — changes at most between splits. */
  static: days(1),
  /** A finished game's stats never change again. */
  completedGame: days(30),
} as const;

/**
 * Never-expiring fallback. Read only when the feed is unreachable or has changed
 * shape, which is the one moment its absence would be felt.
 */
export const LAST_GOOD_TTL_DAYS = 365;

/**
 * Read a cached value without ever producing one.
 *
 * For callers outside the section that want esports data if it happens to be
 * warm and want nothing at all otherwise — a champion build page must not wait
 * on a walk of the pro feed to render a ranked build (TASK-310). Falls through
 * to the last-good copy, because a stale pro strip beside a ranked build is
 * still useful and its absence is the only alternative.
 */
export async function cachedValue<TValue>(key: string, version = 1): Promise<TValue | null> {
  const scoped = cacheKey(key, version);
  const fresh = (await cacheGet(`${scoped}:fresh`)) as TValue | null;
  if (fresh !== null) return fresh;
  return (await cacheGet(`${scoped}:last-good`)) as TValue | null;
}

/**
 * The cache key for a resource, scoped to the shape it was written in.
 *
 * **This is not decoration — it is what stops a deploy serving mangled data.**
 * Both helpers below cache the *mapped* value, and every mapper here runs the
 * payload through Zod first, which strips keys the schema does not name. A copy
 * written before a field was added to a schema therefore has that field missing
 * forever, and a completed game's stats are cached for thirty days.
 *
 * That is not theoretical: adding the end-game stat line to the details schema
 * made every already-cached game render a stat sheet of zeros, because the
 * cached copy predated the fields and no amount of correct mapping code could
 * recover them. Caught in a browser against a live cache.
 *
 * So whenever a schema or a mapped shape in this domain gains a field, bump that
 * resource's version. Old entries are then simply unread and expire on their own.
 * Version 1 is written bare so the many resources that never changed shape keep
 * the keys they already have.
 */
export function cacheKey(key: string, version: number): string {
  return version <= 1 ? `esports:${key}` : `esports:${key}:v${version}`;
}

/**
 * Where this domain's cache entries actually live.
 *
 * In a replayed run they live in this process and nowhere else. Redis is a
 * hosted service, so leaving the normal path in place would have every cache
 * read in an E2E run cross the network to Upstash — a real network call inside
 * a test, which CLAUDE.md 5.4 rules out, and slow enough to matter: a cold hub
 * makes several hundred of them and took over a minute a page to render.
 *
 * Nothing is lost by it. The fixtures are deterministic, so a cache over them
 * only ever returns what the replay would have returned anyway — and it also
 * keeps a replayed run from ever reading a row a real one wrote, which matters
 * because E2E falls back to DATABASE_URL when E2E_DATABASE_URL is unset. Shared
 * storage would otherwise serve live-feed data to the tests and they would pass
 * while testing nothing.
 */
const memoryCache = new Map<string, unknown>();

async function cacheGet(key: string): Promise<unknown | null> {
  if (fixturesEnabled()) return memoryCache.get(key) ?? null;
  return getCached(key).catch(() => null);
}

async function cacheSet(key: string, type: string, value: unknown, ttlDays: number): Promise<void> {
  if (fixturesEnabled()) {
    memoryCache.set(key, value);
    return;
  }
  await setCached(key, type, value, ttlDays).catch(() => undefined);
}

interface CachedComputationOptions<TValue> {
  key: string;
  type: string;
  ttlDays: number;
  compute: () => Promise<TValue>;
  /** Bump when the computed shape gains a field. See `cacheKey`. */
  version?: number;
  /**
   * Rebuild even when the cached copy is still fresh.
   *
   * Only the warm job sets this, and without it warming cannot do its job: a
   * reader-driven cache can only ever be filled *after* it expires, so the first
   * visitor past each expiry pays the rebuild. Refreshing early is the whole
   * point of warming (TASK-305).
   */
  force?: boolean;
}

/**
 * The same fresh + last-good discipline as `cachedResource`, for a value we
 * derive rather than fetch.
 *
 * Aggregations over a whole split cost hundreds of feed reads to rebuild, so a
 * transient failure part-way through must not replace a good answer with
 * nothing — it falls back to the last one that completed, exactly as a failed
 * fetch does.
 */
export async function cachedComputation<TValue>(
  options: CachedComputationOptions<TValue>
): Promise<TValue | null> {
  const scoped = cacheKey(options.key, options.version ?? 1);
  const freshKey = `${scoped}:fresh`;
  const lastGoodKey = `${scoped}:last-good`;

  if (!options.force) {
    const fresh = (await cacheGet(freshKey)) as TValue | null;
    if (fresh !== null) return fresh;
  }

  try {
    const value = await options.compute();

    await Promise.all([
      cacheSet(freshKey, options.type, value, options.ttlDays),
      cacheSet(lastGoodKey, options.type, value, LAST_GOOD_TTL_DAYS),
    ]);

    return value;
  } catch (err) {
    logger.warn(`[esportsApi] ${options.key} computation failed, falling back to last-good`, err);
    return (await cacheGet(lastGoodKey)) as TValue | null;
  }
}

interface CachedResourceOptions<TRaw, TValue> {
  /** Cache key suffix; namespaced to `esports:` internally. */
  key: string;
  /** aiCache `type` column — one per resource class, for cache accounting. */
  type: string;
  ttlDays: number;
  schema: z.ZodType<TRaw>;
  fetcher: () => Promise<Response>;
  map: (raw: TRaw) => TValue;
  /** Bump when the schema or the mapped shape gains a field. See `cacheKey`. */
  version?: number;
  /** Refetch even when the cached copy is still fresh. Set by the warm job only. */
  force?: boolean;
}

/**
 * The fresh + never-expiring last-good read, generalised (ADR-016).
 *
 * Returns the mapped value, or the last good one if this fetch failed or the
 * payload no longer matches the schema, or null if the feed is down and nothing
 * was ever cached. It does not throw: an esports page with no data is a page
 * with an empty state, not a 500.
 *
 * The *mapped* value is what gets cached, not the raw payload — reads are far
 * more frequent than writes, so the mapping is paid once.
 */
export async function cachedResource<TRaw, TValue>(
  options: CachedResourceOptions<TRaw, TValue>
): Promise<TValue | null> {
  const scoped = cacheKey(options.key, options.version ?? 1);
  const freshKey = `${scoped}:fresh`;
  const lastGoodKey = `${scoped}:last-good`;

  if (!options.force) {
    const fresh = (await cacheGet(freshKey)) as TValue | null;
    if (fresh !== null) return fresh;
  }

  try {
    const response = await options.fetcher();
    if (!response.ok) throw new Error(`esports feed responded ${response.status}`);

    const value = options.map(options.schema.parse(await response.json()));

    // A cache write failing is not a reason to fail the request — the caller
    // already has the value it asked for.
    await Promise.all([
      cacheSet(freshKey, options.type, value, options.ttlDays),
      cacheSet(lastGoodKey, options.type, value, LAST_GOOD_TTL_DAYS),
    ]);

    return value;
  } catch (err) {
    logger.warn(`[esportsApi] ${options.key} fetch failed, falling back to last-good`, err);
    return (await cacheGet(lastGoodKey)) as TValue | null;
  }
}
