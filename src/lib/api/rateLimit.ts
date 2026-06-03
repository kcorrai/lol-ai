import { NextRequest, NextResponse } from "next/server";

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

function isUpstashConfigured(): boolean {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

async function getUpstashLimiter(
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
    redis: Redis.fromEnv(),
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

function checkInMemory(
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

// ── Public API ───────────────────────────────────────────────────────────────

// `now` is only used by the in-memory fallback path (for testing).
export async function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  now = Date.now()
): Promise<RateLimitResult> {
  try {
    const limiter = await getUpstashLimiter(config);

    if (limiter) {
      const { success, reset, remaining } = await limiter.limit(key);
      const retryAfterMs = success ? 0 : Math.max(0, reset - Date.now());
      return { allowed: success, retryAfterMs, limit: config.limit, remaining: remaining ?? 0 };
    }
  } catch {
    // Redis unavailable — fall through to in-memory fallback
  }

  return checkInMemory(key, config, now);
}

export function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export function rateLimitResponse(retryAfterMs: number, limit: number): NextResponse {
  const retryAfterSecs = Math.ceil(retryAfterMs / 1000);
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSecs),
        "X-RateLimit-Limit": String(limit),
      },
    }
  );
}
