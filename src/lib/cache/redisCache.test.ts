import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { redisMock } = vi.hoisted(() => ({
  redisMock: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
}));

// A class, not vi.fn(() => redisMock): the module under test calls `new Redis(...)`
// and an arrow function cannot be constructed, so that form throws and every
// assertion below silently degrades into "Redis is unavailable".
vi.mock("@upstash/redis", () => ({
  Redis: class {
    get = redisMock.get;
    set = redisMock.set;
    del = redisMock.del;
  },
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import {
  isRedisCacheConfigured,
  redisCacheGet,
  redisCacheSet,
  redisCacheDelete,
  __resetRedisCache,
} from "./redisCache";

const ENV_KEYS = ["KV_REST_API_URL", "KV_REST_API_TOKEN"] as const;
const saved: Record<string, string | undefined> = {};

function configure(): void {
  process.env.KV_REST_API_URL = "https://example.upstash.io";
  process.env.KV_REST_API_TOKEN = "token";
}

function unconfigure(): void {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
}

beforeEach(() => {
  vi.clearAllMocks();
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  // The client is memoised per process, so without this a client built under one
  // environment would answer for the next test's.
  __resetRedisCache();
  configure();
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("isRedisCacheConfigured", () => {
  it("is false when either variable is missing", () => {
    unconfigure();
    expect(isRedisCacheConfigured()).toBe(false);

    process.env.KV_REST_API_URL = "https://example.upstash.io";
    expect(isRedisCacheConfigured()).toBe(false);
  });

  it("is true when both are present", () => {
    expect(isRedisCacheConfigured()).toBe(true);
  });
});

describe("redisCacheGet", () => {
  it("returns the stored value", async () => {
    redisMock.get.mockResolvedValue({ hello: "world" });
    expect(await redisCacheGet("k")).toEqual({ hello: "world" });
  });

  it("normalises undefined to null", async () => {
    redisMock.get.mockResolvedValue(undefined);
    expect(await redisCacheGet("k")).toBeNull();
  });

  // The point of the whole module: a cache that can fail a request is worse than
  // no cache. TASK-285 was that bug — an unguarded cache write turned a completed
  // preview into a 500.
  it("reports a miss instead of throwing when Redis errors", async () => {
    redisMock.get.mockRejectedValue(new Error("upstash down"));
    await expect(redisCacheGet("k")).resolves.toBeNull();
  });

  it("returns null without constructing a client when unconfigured", async () => {
    unconfigure();
    __resetRedisCache();

    expect(await redisCacheGet("k")).toBeNull();
    expect(redisMock.get).not.toHaveBeenCalled();
  });
});

describe("redisCacheSet", () => {
  it("stores with a second-based expiry and reports success", async () => {
    redisMock.set.mockResolvedValue("OK");

    expect(await redisCacheSet("k", { a: 1 }, 3600)).toBe(true);
    expect(redisMock.set).toHaveBeenCalledWith("k", { a: 1 }, { ex: 3600 });
  });

  // Upstash rejects a non-positive expiry outright, so a sub-second TTL has to be
  // rounded up rather than passed through as 0.
  it("rounds a sub-second TTL up to one second", async () => {
    redisMock.set.mockResolvedValue("OK");

    await redisCacheSet("k", { a: 1 }, 0.4);

    expect(redisMock.set).toHaveBeenCalledWith("k", { a: 1 }, { ex: 1 });
  });

  // False is what makes the caller's Postgres fallback correct — a silent
  // failure here would lose the entry in both stores.
  it("reports failure when Redis errors", async () => {
    redisMock.set.mockRejectedValue(new Error("upstash down"));
    expect(await redisCacheSet("k", { a: 1 }, 60)).toBe(false);
  });

  it("reports failure when unconfigured", async () => {
    unconfigure();
    __resetRedisCache();

    expect(await redisCacheSet("k", { a: 1 }, 60)).toBe(false);
    expect(redisMock.set).not.toHaveBeenCalled();
  });
});

describe("redisCacheDelete", () => {
  it("deletes the key", async () => {
    redisMock.del.mockResolvedValue(1);
    await redisCacheDelete("k");
    expect(redisMock.del).toHaveBeenCalledWith("k");
  });

  it("swallows a Redis error", async () => {
    redisMock.del.mockRejectedValue(new Error("upstash down"));
    await expect(redisCacheDelete("k")).resolves.toBeUndefined();
  });
});
