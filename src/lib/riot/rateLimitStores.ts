import { logger } from "@/lib/utils/logger";
import type { RateWindow } from "@/lib/riot/rateLimitPolicy";

// Where the Riot budget is counted.
//
// The count has to be shared. Every serverless instance is its own process, and a count kept in
// process memory lets each of them spend the whole budget: ten warm instances on a personal key
// is two hundred requests a second against a limit of twenty. Redis is the shared place; memory is
// what is left when Redis is not configured or does not answer — right for local development, and
// better than nothing in production.

export interface WindowStore {
  /**
   * Take one slot in every window, or none.
   *
   * Resolves to 0 when the slot was taken, otherwise to the milliseconds until one could be.
   */
  take(scope: string, windows: RateWindow[], now: number): Promise<number>;
  /** Hold every caller for this scope off until `ms` from now — Riot has told us to stop. */
  pause(scope: string, ms: number, now: number): Promise<void>;
}

/** Exact sliding window: remembers when each request went out. */
export class MemoryWindowStore implements WindowStore {
  private readonly sent = new Map<string, number[]>();
  private readonly pausedUntil = new Map<string, number>();

  async take(scope: string, windows: RateWindow[], now: number): Promise<number> {
    const paused = (this.pausedUntil.get(scope) ?? 0) - now;
    if (paused > 0) return paused;

    const longest = Math.max(0, ...windows.map((w) => w.windowMs));
    const times = (this.sent.get(scope) ?? []).filter((t) => t > now - longest);

    let wait = 0;
    for (const w of windows) {
      const inWindow = times.filter((t) => t > now - w.windowMs);
      if (inWindow.length >= w.limit) {
        // Room returns when the oldest request still inside the window falls out of it.
        const oldest = inWindow[inWindow.length - w.limit];
        wait = Math.max(wait, oldest + w.windowMs - now);
      }
    }

    if (wait === 0) times.push(now);
    this.sent.set(scope, times);
    return wait;
  }

  async pause(scope: string, ms: number, now: number): Promise<void> {
    this.pausedUntil.set(scope, Math.max(this.pausedUntil.get(scope) ?? 0, now + ms));
  }
}

type Limiter = { limit: (id: string) => Promise<{ success: boolean; reset: number }> };
type PauseClient = {
  set: (key: string, value: string, opts: { px: number }) => Promise<unknown>;
  pttl: (key: string) => Promise<number>;
};

const PREFIX = "riot-app";

/**
 * Shared across instances, through `@upstash/ratelimit`.
 *
 * The library counts one window per limiter, so a request is checked window by window, shortest
 * first. A refusal from a later window leaves the earlier ones one slot poorer; the windows are
 * ordered so that the slot lost is always the one that comes back soonest.
 */
export class UpstashWindowStore implements WindowStore {
  private readonly limiters = new Map<string, Limiter>();

  constructor(
    private readonly redis: PauseClient,
    private readonly makeLimiter: (window: RateWindow, prefix: string) => Limiter
  ) {}

  async take(scope: string, windows: RateWindow[], now: number): Promise<number> {
    const paused = await this.redis.pttl(`${PREFIX}:pause:${scope}`);
    if (paused > 0) return paused;

    for (const w of windows) {
      const { success, reset } = await this.limiterFor(w).limit(scope);
      if (!success) return Math.max(1, reset - now);
    }
    return 0;
  }

  async pause(scope: string, ms: number): Promise<void> {
    await this.redis.set(`${PREFIX}:pause:${scope}`, "1", { px: Math.max(1, Math.ceil(ms)) });
  }

  private limiterFor(w: RateWindow): Limiter {
    const key = `${w.limit}:${w.windowMs}`;
    let limiter = this.limiters.get(key);
    if (!limiter) {
      limiter = this.makeLimiter(w, `${PREFIX}:${key}`);
      this.limiters.set(key, limiter);
    }
    return limiter;
  }
}

/** Upstash when it answers, memory when it does not. */
export class FallbackWindowStore implements WindowStore {
  private warned = false;

  constructor(
    private readonly primary: WindowStore | null,
    private readonly fallback: WindowStore
  ) {}

  async take(scope: string, windows: RateWindow[], now: number): Promise<number> {
    if (!this.primary) return this.fallback.take(scope, windows, now);
    try {
      return await this.primary.take(scope, windows, now);
    } catch (err) {
      this.warnOnce(err);
      return this.fallback.take(scope, windows, now);
    }
  }

  async pause(scope: string, ms: number, now: number): Promise<void> {
    // Both: if Redis stops answering between the pause and the next take, the pause still holds here.
    await this.fallback.pause(scope, ms, now);
    if (!this.primary) return;
    try {
      await this.primary.pause(scope, ms, now);
    } catch (err) {
      this.warnOnce(err);
    }
  }

  private warnOnce(err: unknown): void {
    if (this.warned) return;
    this.warned = true;
    logger.warn(
      "[riot] shared rate-limit store failed — counting Riot calls per instance until it recovers",
      err
    );
  }
}

export async function createUpstashWindowStore(): Promise<WindowStore | null> {
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.KV_REST_API_URL,
    token: process.env.KV_REST_API_TOKEN,
    // `no-store` throws during static generation; see ADR-045.
    cache: "no-cache",
  });

  return new UpstashWindowStore(
    redis as unknown as PauseClient,
    (w, prefix) =>
      new Ratelimit({
        redis,
        prefix,
        limiter: Ratelimit.slidingWindow(w.limit, `${w.windowMs} ms`),
        analytics: false,
      })
  );
}
