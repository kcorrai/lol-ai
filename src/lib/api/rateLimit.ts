import { NextRequest, NextResponse } from "next/server";
import {
  getUpstashLimiter,
  checkInMemory,
  warnUpstashNotConfigured,
  type RateLimitConfig,
  type RateLimitResult,
} from "@/lib/api/rateLimitBackends";

export type { RateLimitConfig, RateLimitResult } from "@/lib/api/rateLimitBackends";

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

  warnUpstashNotConfigured();
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
  const resetAt = Math.ceil((Date.now() + retryAfterMs) / 1000);
  return NextResponse.json(
    { error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSecs),
        "X-RateLimit-Limit": String(limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(resetAt),
      },
    }
  );
}

// Appends standard rate limit headers to an existing success response.
// Call this after checking the rate limit to expose quota info to clients.
export function addRateLimitHeaders(
  response: NextResponse,
  result: RateLimitResult,
  windowMs: number
): NextResponse {
  const resetAt = Math.ceil((Date.now() + windowMs) / 1000);
  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));
  response.headers.set("X-RateLimit-Reset", String(resetAt));
  return response;
}
