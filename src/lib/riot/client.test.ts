import { describe, it, expect, vi, beforeEach } from "vitest";
import { RiotHttpClient } from "./client";
import type { CacheStore } from "./cache";
import type { TokenBucket } from "./rateLimit";

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
  };
}

const limiter = { consume: async () => {} } as unknown as TokenBucket;

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
      cacheTtl: 60, cacheKey: "k", noCacheEmptyArray: true, skipRateLimit: true,
    });

    expect(res).toEqual([]);
    expect(cache.store.has("k")).toBe(false);
  });

  it("still caches a non-empty array", async () => {
    const cache = makeCache();
    global.fetch = mockFetch(["a", "b"]);
    const client = new RiotHttpClient("key", cache, limiter);

    await client.get<string[]>("http://x", {
      cacheTtl: 60, cacheKey: "k", noCacheEmptyArray: true, skipRateLimit: true,
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
