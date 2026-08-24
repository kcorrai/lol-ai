import { logger } from "@/lib/utils/logger";

// A minimal cache over Upstash Redis, used to keep regenerable entries out of the
// primary database (TASK-293, ADR-014). Deliberately narrow: get, set with a TTL,
// delete. Anything richer belongs to the caller.
//
// Every operation is failure-tolerant. A cache is an optimisation, and an
// optimisation that can fail a request is a liability — TASK-285 was exactly that
// bug, where an unguarded cache write turned a completed preview into a 500. Here
// a read error is reported as a miss and a write error is dropped, so the worst
// outcome of Redis being unreachable is the work being done again.

type RedisClient = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown, opts: { ex: number }) => Promise<unknown>;
  del: (...keys: string[]) => Promise<unknown>;
  hincrby: (key: string, field: string, increment: number) => Promise<number>;
  hgetall: (key: string) => Promise<Record<string, unknown> | null>;
  expire: (key: string, seconds: number) => Promise<unknown>;
};

let client: RedisClient | null = null;
let warned = false;

export function isRedisCacheConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Warn once per process. Each serverless cold start emits it, which is the same
// deliberate trade-off rateLimitBackends makes: noisy, but silence here means an
// unnoticed fallback to the database this task exists to relieve.
function warnNotConfigured(): void {
  if (warned) return;
  warned = true;
  logger.warn(
    "[cache] Upstash Redis is not configured — AI cache entries fall back to Postgres. " +
      "This is the pre-TASK-293 behaviour and works, but every cache read and write " +
      "then counts against the Neon transfer allowance. Set KV_REST_API_URL and " +
      "KV_REST_API_TOKEN."
  );
}

async function getClient(): Promise<RedisClient | null> {
  if (!isRedisCacheConfigured()) {
    warnNotConfigured();
    return null;
  }
  if (client) return client;

  try {
    const { Redis } = await import("@upstash/redis");
    client = new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    }) as unknown as RedisClient;
    return client;
  } catch (err) {
    logger.warn("[cache] could not construct the Redis client", err);
    return null;
  }
}

// Returns null both when the key is absent and when Redis cannot answer. The
// caller cannot distinguish the two, and should not: both mean "regenerate".
export async function redisCacheGet(key: string): Promise<unknown | null> {
  const redis = await getClient();
  if (!redis) return null;

  try {
    const value = await redis.get(key);
    return value ?? null;
  } catch (err) {
    logger.warn(`[cache] Redis read failed for ${key}, treating as a miss`, err);
    return null;
  }
}

// Reports whether the value was stored, so a caller that needs the entry to
// survive can fall back to a durable store instead of silently losing it.
export async function redisCacheSet(
  key: string,
  value: unknown,
  ttlSeconds: number
): Promise<boolean> {
  const redis = await getClient();
  if (!redis) return false;

  // Upstash rejects a non-positive expiry outright; round up so that a sub-second
  // TTL still stores something rather than throwing.
  const ex = Math.max(1, Math.ceil(ttlSeconds));

  try {
    await redis.set(key, value, { ex });
    return true;
  } catch (err) {
    logger.warn(`[cache] Redis write failed for ${key}, entry not cached`, err);
    return false;
  }
}

export async function redisCacheDelete(key: string): Promise<void> {
  return redisCacheDeleteMany([key]);
}

// One DEL for the whole set rather than one per key. Upstash speaks REST, so each command is its
// own HTTPS round trip from the function's region — six keys was six of them.
export async function redisCacheDeleteMany(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const redis = await getClient();
  if (!redis) return;

  try {
    await redis.del(...keys);
  } catch (err) {
    logger.warn(`[cache] Redis delete failed for ${keys.length} key(s)`, err);
  }
}

/**
 * Adds to counters in a hash, and keeps the whole hash alive for `ttlSeconds`.
 *
 * A counter is not a cache entry: `redisCacheSet` would overwrite the running total rather than
 * add to it, and read-modify-write from the application would lose increments under any
 * concurrency at all. `HINCRBY` is the operation this actually needs.
 *
 * The expiry is refreshed on every write rather than set once, so a key stays alive as long as
 * something is still counting into it and then falls out on its own. Failure-tolerant like the
 * rest of this module: losing a counter should never fail the work being counted.
 */
export async function redisCacheHashIncrBy(
  key: string,
  fields: Record<string, number>,
  ttlSeconds: number
): Promise<boolean> {
  const redis = await getClient();
  if (!redis) return false;

  try {
    for (const [field, by] of Object.entries(fields)) {
      if (by === 0) continue;
      await redis.hincrby(key, field, by);
    }
    await redis.expire(key, Math.max(1, Math.ceil(ttlSeconds)));
    return true;
  } catch (err) {
    logger.warn(`[cache] Redis counter write failed for ${key}`, err);
    return false;
  }
}

/** Every counter in a hash, as numbers. An unreachable Redis and an absent key both read as {}. */
export async function redisCacheHashGetAll(key: string): Promise<Record<string, number>> {
  const redis = await getClient();
  if (!redis) return {};

  try {
    const raw = await redis.hgetall(key);
    if (!raw) return {};
    const out: Record<string, number> = {};
    for (const [field, value] of Object.entries(raw)) {
      const n = Number(value);
      if (Number.isFinite(n)) out[field] = n;
    }
    return out;
  } catch (err) {
    logger.warn(`[cache] Redis counter read failed for ${key}`, err);
    return {};
  }
}

// Test seam — the client is memoised per process, so a suite that swaps the
// environment needs a way to drop it without reaching into module internals.
export function __resetRedisCache(): void {
  client = null;
  warned = false;
}
