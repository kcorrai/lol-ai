import { riotCache, type CacheStore } from "@/lib/riot/cache";
import { getRiotRateLimiter, type RiotRateLimiter } from "@/lib/riot/rateLimit";
import { rateLimitScope } from "@/lib/riot/rateLimitPolicy";
import { raiseRiotAlarm } from "@/lib/riot/alarms";
import { withRetry } from "@/lib/riot/retry";
import { normalizeRiotError } from "@/lib/riot/errors";
import { isRiotMocked, riotFixtureFor } from "@/lib/riot/e2eFixtures";
import { logger } from "@/lib/utils/logger";

type RequestOptions = {
  // TTL in seconds for caching the response (0 = no cache)
  cacheTtl?: number;
  // Override cache key (defaults to the URL)
  cacheKey?: string;
  // Skip rate limiter — use only in tests
  skipRateLimit?: boolean;
  // Don't cache an empty-array result. Used for match-id lists: Riot can transiently return `[]`
  // (eventual consistency, esp. new PUUID-only accounts) and caching that empty for the TTL would
  // block a re-sync from ever picking the matches up (TASK-227).
  noCacheEmptyArray?: boolean;
};

// Generous next to Riot's real latency distribution, tight next to the 300s platform ceiling a
// hung connection would otherwise run to.
const REQUEST_TIMEOUT_MS = 10_000;

export class RiotHttpClient {
  private readonly apiKey: string;
  private readonly cache: CacheStore;
  private readonly limiter: RiotRateLimiter | null;

  constructor(
    apiKey: string = process.env.RIOT_API_KEY ?? "",
    cache: CacheStore = riotCache,
    // Resolved on first use rather than here, so importing the client never reaches for Redis.
    limiter: RiotRateLimiter | null = null
  ) {
    this.apiKey = apiKey;
    this.cache = cache;
    this.limiter = limiter;
  }

  async get<T>(url: string, options: RequestOptions = {}): Promise<T> {
    const { cacheTtl = 0, cacheKey, skipRateLimit = false, noCacheEmptyArray = false } = options;
    const key = cacheKey ?? url;

    // Cache hit — skip rate limiter and network call
    if (cacheTtl > 0) {
      const cached = await this.cache.get<T>(key);
      if (cached !== null) {
        logger.debug(`[RiotClient] cache hit: ${key}`);
        return cached;
      }
    }

    // Inside the retry, so a retry is counted like any other request — a retried 429 that skipped
    // the gate was exactly the burst that earns a blacklist.
    const result = await withRetry(() => this.limitedFetch<T>(url, skipRateLimit), {
      maxAttempts: 3,
      baseDelayMs: 1000,
      maxDelayMs: 10_000,
    });

    const isEmptyArray = Array.isArray(result) && result.length === 0;
    if (cacheTtl > 0 && !(noCacheEmptyArray && isEmptyArray)) {
      await this.cache.set(key, result, cacheTtl);
    }

    return result;
  }

  private async limitedFetch<T>(url: string, skipRateLimit: boolean): Promise<T> {
    if (skipRateLimit || isRiotMocked()) return this.fetch<T>(url);

    const limiter = this.limiter ?? (await getRiotRateLimiter());
    const scope = rateLimitScope(url);
    await limiter.acquire(scope);
    return this.fetch<T>(url, limiter, scope);
  }

  private async fetch<T>(url: string, limiter?: RiotRateLimiter, scope?: string): Promise<T> {
    logger.debug(`[RiotClient] GET ${url}`);

    // The one gate. Every Riot request in the app leaves from here, so a mocked run cannot reach
    // the network by way of an endpoint somebody adds later — and an endpoint with no fixture
    // throws by name rather than going out with a fake key and collecting a 401 (LA-71).
    if (isRiotMocked()) {
      const fixture = riotFixtureFor(url);
      if (fixture.kind === "status") throw normalizeRiotError(fixture.status);
      return fixture.body as T;
    }

    const response = await fetch(url, {
      headers: {
        "X-Riot-Token": this.apiKey,
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Charset": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      // Disable Next.js fetch cache — we manage caching ourselves. `no-cache` says that
      // as completely as `no-store` does and does not throw inside a prerender (ADR-045);
      // nothing here is reached from one today, but the rule is easier to keep whole.
      cache: "no-cache",
      // Riot's p99 is well under two seconds. Without a bound, a stalled connection pins the
      // invocation — and its memory reservation and its database connection — until the platform's
      // 300s ceiling, three times over because withRetry will try again. The AI providers have
      // carried the same guard since they were written (see providers/openai.ts); the Riot client
      // never did. withRetry treats the resulting TimeoutError as retryable.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (limiter && scope) limiter.learn(scope, response.headers.get("X-App-Rate-Limit"));

    if (!response.ok) {
      const retryAfter = response.headers.get("Retry-After");
      const retryAfterSeconds = retryAfter ? Number(retryAfter) : undefined;
      // Only an application-wide 429 stops everyone. A method 429 is one endpoint's budget, and a
      // service 429 is Riot's own capacity — neither is a reason to stop calling other endpoints.
      const limitType = response.headers.get("X-Rate-Limit-Type");
      if (response.status === 429 && limitType === "application" && limiter && scope) {
        raiseRiotAlarm("app-rate-limited", scope, { retryAfterSeconds });
        await limiter.pause(scope, (retryAfterSeconds ?? 1) * 1000);
      }
      if (response.status === 401 || response.status === 403) {
        raiseRiotAlarm("key-rejected", scope ?? rateLimitScope(url), { status: response.status });
      }
      throw normalizeRiotError(response.status, retryAfterSeconds);
    }

    return response.json() as Promise<T>;
  }
}

// Singleton — one client per process (shares rate limiter and cache)
export const riotClient = new RiotHttpClient();
