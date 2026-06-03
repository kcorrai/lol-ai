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

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Fixed-window in-memory store.
// On Vercel serverless, Lambda instances don't share memory — this provides
// best-effort per-instance protection. For multi-instance rate limiting,
// replace with @upstash/ratelimit + Redis.
const store = new Map<string, RateLimitEntry>();

export function checkRateLimit(
  key: string,
  config: RateLimitConfig,
  now = Date.now()
): RateLimitResult {
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + config.windowMs });
    return { allowed: true, retryAfterMs: 0, limit: config.limit, remaining: config.limit - 1 };
  }

  if (entry.count >= config.limit) {
    return { allowed: false, retryAfterMs: entry.resetAt - now, limit: config.limit, remaining: 0 };
  }

  entry.count++;
  return {
    allowed: true,
    retryAfterMs: 0,
    limit: config.limit,
    remaining: config.limit - entry.count,
  };
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
