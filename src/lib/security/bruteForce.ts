import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/utils/logger";
import { audit } from "@/lib/audit/auditService";

// In-memory fallback (single-instance dev). Production uses Upstash via the
// rateLimit module pattern — this mirrors that approach.
const memoryCounters = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 5;

async function getRedisCount(key: string): Promise<number | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    const count = await redis.incr(key);
    if (count === 1) await redis.expire(key, WINDOW_MS / 1000);
    return count;
  } catch {
    return null;
  }
}

async function clearRedisKey(key: string): Promise<void> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return;
  try {
    const { Redis } = await import("@upstash/redis");
    const redis = new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    });
    await redis.del(key);
  } catch {
    /* non-critical */
  }
}

export async function recordFailedAttempt(identifier: string): Promise<void> {
  const key = `brute-force:${identifier}`;
  let count: number;

  const redisCount = await getRedisCount(key);
  if (redisCount !== null) {
    count = redisCount;
  } else {
    const entry = memoryCounters.get(key);
    const now = Date.now();
    if (!entry || entry.resetAt < now) {
      memoryCounters.set(key, { count: 1, resetAt: now + WINDOW_MS });
      count = 1;
    } else {
      entry.count++;
      count = entry.count;
    }
  }

  if (count >= MAX_ATTEMPTS) {
    logger.warn("[bruteForce] Threshold reached", { identifier, count });
    Sentry.captureEvent({
      level: "warning",
      message: "Brute force attempt detected",
      extra: { identifier, count },
    });

    await audit({
      action: "auth.login.failed",
      metadata: { identifier, count, reason: "brute_force_threshold" },
      ipAddress: identifier,
    }).catch(() => {
      /* non-critical */
    });

    throw new Error("TOO_MANY_ATTEMPTS");
  }
}

export async function clearFailedAttempts(identifier: string): Promise<void> {
  const key = `brute-force:${identifier}`;
  memoryCounters.delete(key);
  await clearRedisKey(key);
}
