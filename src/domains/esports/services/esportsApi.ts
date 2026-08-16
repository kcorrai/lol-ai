import type { z } from "zod";
import { getCached, setCached } from "@/lib/ai/aiCache";
import { logger } from "@/lib/utils/logger";

// The only module that knows the esports feeds exist. Everything else in the
// domain goes through esportsFetch/livestatsFetch and cachedResource, so the
// unofficial-endpoint handling (ADR-016) lives in exactly one place.

export const ESPORTS_API_BASE = "https://esports-api.lolesports.com/persisted/gw";
export const LIVESTATS_BASE = "https://feed.lolesports.com/livestats/v1";
export const USER_AGENT = "laneiq (+https://lolaicoach.gg)";

// The key the lolesports.com web client ships inside its own JavaScript bundle.
// It is not a credential: it is public, tied to no account of ours, and grants
// nothing beyond the same public read access anyone gets by loading the site.
// It is read from the environment so it can be repointed without a deploy, and
// it must never be sent from a browser — every caller here is server-side.
const PUBLIC_WEB_KEY = "0TvQnueqKa5mxJntVWt0w4LpLfEkrV1Ta8rQBb9Z";

function apiKey(): string {
  return process.env.LOLESPORTS_API_KEY || PUBLIC_WEB_KEY;
}

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
 * The feed publishes some asset URLs over plain http. The CSP blocks mixed
 * content, so every image URL is upgraded on the way through the mapper.
 */
export function httpsAsset(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith("http://") ? `https://${url.slice("http://".length)}` : url;
}

interface FetchOptions {
  /** Extra query params. `hl` defaults to en-US and can be overridden. */
  params?: Record<string, string | undefined>;
  signal?: AbortSignal;
}

function buildUrl(base: string, path: string, params: Record<string, string | undefined>): string {
  const url = new URL(`${base}/${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, value);
  }
  return url.toString();
}

/** GET against the persisted-gw esports API. */
export function esportsFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const url = buildUrl(ESPORTS_API_BASE, path, { hl: "en-US", ...options.params });
  return fetch(url, {
    headers: { "x-api-key": apiKey(), "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: options.signal,
    // Our own cache layer owns freshness for this domain. Letting the Next.js
    // fetch cache hold a second, differently-timed copy would mean two answers
    // to "how old is this", and the TTLs above would stop being the truth.
    cache: "no-store",
  });
}

/** GET against the livestats game-state feed. It takes no API key. */
export function livestatsFetch(path: string, options: FetchOptions = {}): Promise<Response> {
  const url = buildUrl(LIVESTATS_BASE, path, { ...options.params });
  return fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: options.signal,
    cache: "no-store",
  });
}

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
  const fresh = (await getCached(`${scoped}:fresh`).catch(() => null)) as TValue | null;
  if (fresh !== null) return fresh;
  return (await getCached(`${scoped}:last-good`).catch(() => null)) as TValue | null;
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
    const fresh = (await getCached(freshKey).catch(() => null)) as TValue | null;
    if (fresh !== null) return fresh;
  }

  try {
    const value = await options.compute();

    await Promise.all([
      setCached(freshKey, options.type, value, options.ttlDays).catch(() => undefined),
      setCached(lastGoodKey, options.type, value, LAST_GOOD_TTL_DAYS).catch(() => undefined),
    ]);

    return value;
  } catch (err) {
    logger.warn(`[esportsApi] ${options.key} computation failed, falling back to last-good`, err);
    return (await getCached(lastGoodKey).catch(() => null)) as TValue | null;
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
    const fresh = (await getCached(freshKey).catch(() => null)) as TValue | null;
    if (fresh !== null) return fresh;
  }

  try {
    const response = await options.fetcher();
    if (!response.ok) throw new Error(`esports feed responded ${response.status}`);

    const value = options.map(options.schema.parse(await response.json()));

    // A cache write failing is not a reason to fail the request — the caller
    // already has the value it asked for.
    await Promise.all([
      setCached(freshKey, options.type, value, options.ttlDays).catch(() => undefined),
      setCached(lastGoodKey, options.type, value, LAST_GOOD_TTL_DAYS).catch(() => undefined),
    ]);

    return value;
  } catch (err) {
    logger.warn(`[esportsApi] ${options.key} fetch failed, falling back to last-good`, err);
    return (await getCached(lastGoodKey).catch(() => null)) as TValue | null;
  }
}
