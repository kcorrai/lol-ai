import { logger } from "@/lib/utils/logger";

export interface RateLimitConfig {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterMs: number;
  limit: number;
  remaining: number;
}

// ── Upstash Redis backend ────────────────────────────────────────────────────

// Lazily import Upstash to avoid breaking when env vars are absent.
// Cache limiter instances by config key to avoid re-creating on every call.
let upstashLimiters: Map<string, import("@upstash/ratelimit").Ratelimit> | null = null;

// Warn once per process startup if Upstash is not configured.
// In Vercel serverless, each cold start emits this — that's intentional.
let _upstashWarned = false;

function isUpstashConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

export function warnUpstashNotConfigured(): void {
  if (_upstashWarned) return;
  _upstashWarned = true;
  logger.warn(
    "[rateLimit] Upstash Redis is not configured — falling back to per-instance in-memory " +
      "rate limiting. This is NOT effective in production serverless environments where each " +
      "instance has independent memory. Set KV_REST_API_URL and KV_REST_API_TOKEN."
  );
}

export async function getUpstashLimiter(
  config: RateLimitConfig
): Promise<import("@upstash/ratelimit").Ratelimit | null> {
  if (!isUpstashConfigured()) return null;

  if (!upstashLimiters) upstashLimiters = new Map();

  const cacheKey = `${config.limit}:${config.windowMs}`;
  if (upstashLimiters.has(cacheKey)) return upstashLimiters.get(cacheKey)!;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  const windowSeconds = Math.ceil(config.windowMs / 1000);
  const limiter = new Ratelimit({
    redis: new Redis({
      url: process.env.KV_REST_API_URL!,
      token: process.env.KV_REST_API_TOKEN!,
    }),
    limiter: Ratelimit.slidingWindow(config.limit, `${windowSeconds} s`),
    analytics: false,
  });

  upstashLimiters.set(cacheKey, limiter);
  return limiter;
}

// ── In-memory fallback (single-instance best-effort) ─────────────────────────

interface InMemoryEntry {
  count: number;
  resetAt: number;
}

const inMemoryStore = new Map<string, InMemoryEntry>();

export function checkInMemory(
  key: string,
  config: RateLimitConfig,
  now: number
): RateLimitResult {
  const entry = inMemoryStore.get(key);

  if (!entry || now >= entry.resetAt) {
    inMemoryStore.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterMs: 0, limit: config.limit, remaining: config.limit - 1 };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now, limit: config.limit, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0, limit: config.limit, remaining: config.limit - entry.count };
}
