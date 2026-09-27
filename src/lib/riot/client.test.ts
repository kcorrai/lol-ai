import { describe, it, expect, vi, beforeEach } from "vitest";
import { RiotHttpClient } from "./client";
import type { CacheStore } from "./cache";
import { RiotRateLimiter } from "./rateLimit";
import { MemoryWindowStore } from "./rateLimitStores";

function makeCache(): CacheStore & { store: Map<string, unknown> } {
  const store = new Map<string, unknown>();
  return {
    store,
    async get<T>(k: string) {
      return (store.has(k) ? store.get(k) : null) as T | null;
    },
    async set<T>(k: string, v: T) {
      store.set(k, v);
    },
    async del(k: string) {
      store.delete(k);
    },
    async delByPrefix(prefix: string) {
      for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
    },
  };
}

const limiter = new RiotRateLimiter({ store: new MemoryWindowStore() });

function mockFetch(payload: unknown) {
  return vi.fn(async () => ({
    ok: true,
    json: async () => payload,
    headers: { get: () => null },
  })) as unknown as typeof fetch;
}

describe("RiotHttpClient caching", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("does NOT cache an empty array when noCacheEmptyArray is set (TASK-227)", async () => {
    const cache = makeCache();
    global.fetch = mockFetch([]);
    const client = new RiotHttpClient("key", cache, limiter);

    const res = await client.get<string[]>("http://x", {
      cacheTtl: 60,
      cacheKey: "k",
      noCacheEmptyArray: true,
      skipRateLimit: true,
    });

    expect(res).toEqual([]);
    expect(cache.store.has("k")).toBe(false);
  });

  it("still caches a non-empty array", async () => {
    const cache = makeCache();
    global.fetch = mockFetch(["a", "b"]);
    const client = new RiotHttpClient("key", cache, limiter);

    await client.get<string[]>("http://x", {
      cacheTtl: 60,
      cacheKey: "k",
      noCacheEmptyArray: true,
      skipRateLimit: true,
    });

    expect(cache.store.get("k")).toEqual(["a", "b"]);
  });

  it("caches an empty array when the flag is not set (default behaviour)", async () => {
    const cache = makeCache();
    global.fetch = mockFetch([]);
    const client = new RiotHttpClient("key", cache, limiter);

    await client.get<string[]>("http://x", { cacheTtl: 60, cacheKey: "k", skipRateLimit: true });

    expect(cache.store.get("k")).toEqual([]);
  });
});

describe("RiotHttpClient timeouts", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("passes an abort signal so a stalled connection cannot pin the invocation", async () => {
    const fetchMock = vi.fn(async (_url: string, _init?: RequestInit) => ({
      ok: true,
      json: async () => ({}),
      headers: { get: () => null },
    }));
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new RiotHttpClient("key", makeCache(), limiter);
    await client.get("http://x", { skipRateLimit: true });

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
  });

  // The timeout is only worth having if the failure it produces is retryable rather than fatal —
  // a TimeoutError carries no HTTP status, so withRetry has to recognise it by name.
  it("surfaces a timeout as a retryable error", async () => {
    const { withRetry } = await import("./retry");

    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error("timed out"), { name: "TimeoutError" }))
      .mockResolvedValue({ ok: true, json: async () => ({ ok: 1 }), headers: { get: () => null } });
    global.fetch = fetchMock as unknown as typeof fetch;

    const client = new RiotHttpClient("key", makeCache(), limiter);
    const out = await withRetry(
      () => client.get<{ ok: number }>("http://x", { skipRateLimit: true }),
      {
        maxAttempts: 2,
        baseDelayMs: 1,
        maxDelayMs: 2,
      }
    );

    expect(out).toEqual({ ok: 1 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("RiotHttpClient rate limiting", () => {
  beforeEach(() => vi.restoreAllMocks());

  function response(status: number, headers: Record<string, string>) {
    return {
      ok: status < 400,
      status,
      json: async () => ({}),
      headers: { get: (name: string) => headers[name] ?? null },
    };
  }

  it("asks the limiter for room in the request's region before every attempt", async () => {
    const acquire = vi.fn(async () => {});
    const gate = { acquire, learn: vi.fn(), pause: vi.fn() } as unknown as RiotRateLimiter;
    global.fetch = vi.fn(async () => response(200, {})) as unknown as typeof fetch;

    await new RiotHttpClient("key", makeCache(), gate).get("https://euw1.api.riotgames.com/x");

    expect(acquire).toHaveBeenCalledWith("euw1.api.riotgames.com");
  });

  it("learns the key's real limits from the response", async () => {
    const learn = vi.fn();
    const gate = { acquire: vi.fn(), learn, pause: vi.fn() } as unknown as RiotRateLimiter;
    global.fetch = vi.fn(async () =>
      response(200, { "X-App-Rate-Limit": "500:10,30000:600" })
    ) as unknown as typeof fetch;

    await new RiotHttpClient("key", makeCache(), gate).get("https://europe.api.riotgames.com/x");

    expect(learn).toHaveBeenCalledWith("europe.api.riotgames.com", "500:10,30000:600");
  });

  it("pauses the whole region on an application 429, and not on a method 429", async () => {
    const pause = vi.fn(async () => {});
    const gate = { acquire: vi.fn(), learn: vi.fn(), pause } as unknown as RiotRateLimiter;
    const client = new RiotHttpClient("key", makeCache(), gate);

    global.fetch = vi.fn(async () =>
      response(429, { "Retry-After": "30", "X-Rate-Limit-Type": "method" })
    ) as unknown as typeof fetch;
    await expect(client.get("https://euw1.api.riotgames.com/x")).rejects.toThrow();
    expect(pause).not.toHaveBeenCalled();

    global.fetch = vi.fn(async () =>
      response(429, { "Retry-After": "30", "X-Rate-Limit-Type": "application" })
    ) as unknown as typeof fetch;
    await expect(client.get("https://euw1.api.riotgames.com/x")).rejects.toThrow();
    expect(pause).toHaveBeenCalledWith("euw1.api.riotgames.com", 30_000);
  });
});
