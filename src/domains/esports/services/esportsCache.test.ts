import { describe, it, expect, vi, beforeEach } from "vitest";
import { z } from "zod";

vi.mock("@/lib/ai/aiCache", () => ({
  getCached: vi.fn(),
  setCached: vi.fn(),
}));
vi.mock("@/lib/utils/logger", () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}));

import { cachedComputation, cachedResource, cachedValue, TTL } from "./esportsCache";
import { getCached, setCached } from "@/lib/ai/aiCache";

const mockGetCached = getCached as unknown as ReturnType<typeof vi.fn>;
const mockSetCached = setCached as unknown as ReturnType<typeof vi.fn>;

const Schema = z.object({ value: z.number() });

function jsonResponse(body: unknown, ok = true, status = 200): Response {
  return { ok, status, json: async () => body } as unknown as Response;
}

function resource(fetcher: () => Promise<Response>) {
  return cachedResource({
    key: "widget",
    type: "esports-test",
    ttlDays: TTL.schedule,
    schema: Schema,
    fetcher,
    map: (raw) => raw.value * 2,
  });
}

describe("cachedResource", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCached.mockResolvedValue(null);
    mockSetCached.mockResolvedValue(undefined);
  });

  it("serves the fresh entry without touching the feed", async () => {
    mockGetCached.mockImplementation(async (key: string) =>
      key === "esports:widget:fresh" ? 42 : null
    );
    const fetcher = vi.fn();

    expect(await resource(fetcher)).toBe(42);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("fetches, maps and writes both the fresh and last-good entries", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ value: 21 }));

    expect(await resource(fetcher)).toBe(42);

    const written = mockSetCached.mock.calls.map((call) => [call[0], call[2], call[3]]);
    expect(written).toEqual([
      ["esports:widget:fresh", 42, TTL.schedule],
      // The last-good copy is the whole point of the pattern: it outlives every
      // fresh window so an outage has something to serve.
      ["esports:widget:last-good", 42, 365],
    ]);
  });

  it("falls back to last-good when the payload no longer matches the schema", async () => {
    mockGetCached.mockImplementation(async (key: string) =>
      key === "esports:widget:last-good" ? 99 : null
    );
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ value: "not a number" }));

    expect(await resource(fetcher)).toBe(99);
    // A shape change must never be written over the good copy.
    expect(mockSetCached).not.toHaveBeenCalled();
  });

  it("falls back to last-good on a network error", async () => {
    mockGetCached.mockImplementation(async (key: string) =>
      key === "esports:widget:last-good" ? 7 : null
    );
    const fetcher = vi.fn().mockRejectedValue(new Error("ECONNRESET"));

    expect(await resource(fetcher)).toBe(7);
  });

  it("falls back to last-good on a non-OK response", async () => {
    mockGetCached.mockImplementation(async (key: string) =>
      key === "esports:widget:last-good" ? 5 : null
    );
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ value: 1 }, false, 503));

    expect(await resource(fetcher)).toBe(5);
  });

  it("returns null when the feed is down and nothing was ever cached", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("down"));

    // Null, not a throw: a page with no esports data is an empty state, not a 500.
    expect(await resource(fetcher)).toBeNull();
  });

  it("still returns the value when writing the cache fails", async () => {
    mockSetCached.mockRejectedValue(new Error("redis unavailable"));
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ value: 10 }));

    expect(await resource(fetcher)).toBe(20);
  });
});

describe("cachedComputation", () => {
  // One in-memory store standing in for the two-tier cache, so a value written
  // by one helper and read by another have to agree about the key.
  const store = new Map<string, unknown>();

  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    mockGetCached.mockImplementation(async (key: string) =>
      store.has(key) ? store.get(key) : null
    );
    mockSetCached.mockImplementation(async (key: string, _type: string, content: unknown) => {
      store.set(key, content);
    });
  });

  function computation(compute: () => Promise<unknown>, key = "pro-sample:all") {
    return cachedComputation({ key, type: "esports-test", ttlDays: TTL.standings, compute });
  }

  it("computes once, then serves the cached value", async () => {
    const compute = vi.fn(async () => ({ answer: 42 }));

    expect(await computation(compute)).toEqual({ answer: 42 });
    expect(await computation(compute)).toEqual({ answer: 42 });
    expect(compute).toHaveBeenCalledTimes(1);
  });

  it("serves the last good value when a rebuild throws", async () => {
    await computation(async () => ({ answer: 42 }));
    store.delete("esports:pro-sample:all:fresh");

    const result = await computation(async () => {
      throw new Error("feed is down");
    });

    // Hundreds of feed reads go into this; a transient failure part-way must
    // not replace a good aggregate with nothing.
    expect(result).toEqual({ answer: 42 });
  });

  it("returns null when it has never succeeded", async () => {
    const result = await computation(async () => {
      throw new Error("feed is down");
    });

    expect(result).toBeNull();
  });
});

describe("cachedValue", () => {
  const store = new Map<string, unknown>();

  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    mockGetCached.mockImplementation(async (key: string) =>
      store.has(key) ? store.get(key) : null
    );
    mockSetCached.mockImplementation(async (key: string, _type: string, content: unknown) => {
      store.set(key, content);
    });
  });

  /**
   * The failure this guards is silent. `cachedValue` builds its keys separately
   * from `cachedComputation`, so a rename on either side leaves every cache-only
   * reader missing forever — and the only symptom would be a pro strip that
   * never appears on any build page (TASK-310).
   */
  it("reads exactly what cachedComputation writes", async () => {
    await cachedComputation({
      key: "pro-sample:all",
      type: "esports-test",
      ttlDays: TTL.standings,
      compute: async () => ({ answer: 42 }),
    });

    expect(await cachedValue("pro-sample:all")).toEqual({ answer: 42 });
  });

  it("falls through to the last-good copy once the fresh one expires", async () => {
    await cachedComputation({
      key: "pro-sample:all",
      type: "esports-test",
      ttlDays: TTL.standings,
      compute: async () => ({ answer: 42 }),
    });
    store.delete("esports:pro-sample:all:fresh");

    expect(await cachedValue("pro-sample:all")).toEqual({ answer: 42 });
  });

  it("returns null rather than producing a value", async () => {
    expect(await cachedValue("pro-sample:all")).toBeNull();
    // A cache-only read must never fill the cache — that is the whole point.
    expect(mockSetCached).not.toHaveBeenCalled();
  });
});

describe("forced refresh", () => {
  const store = new Map<string, unknown>();

  beforeEach(() => {
    vi.clearAllMocks();
    store.clear();
    mockGetCached.mockImplementation(async (key: string) =>
      store.has(key) ? store.get(key) : null
    );
    mockSetCached.mockImplementation(async (key: string, _type: string, content: unknown) => {
      store.set(key, content);
    });
  });

  /**
   * Why this matters: without `force`, a warm job can only ever fill a cache
   * entry that has *already* expired — which means the first reader past each
   * expiry still pays the rebuild, and warming buys nothing (TASK-305).
   */
  it("rebuilds a computation that is still fresh", async () => {
    const compute = vi.fn(async () => ({ answer: 1 }));
    const options = { key: "warm-me", type: "esports-test", ttlDays: TTL.standings, compute };

    await cachedComputation(options);
    expect(compute).toHaveBeenCalledTimes(1);

    // Without force this is served from cache and the counter stays at one.
    await cachedComputation(options);
    expect(compute).toHaveBeenCalledTimes(1);

    await cachedComputation({ ...options, force: true });
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it("refetches a resource that is still fresh", async () => {
    const fetcher = vi.fn().mockResolvedValue(jsonResponse({ value: 21 }));
    const options = {
      key: "widget",
      type: "esports-test",
      ttlDays: TTL.schedule,
      schema: Schema,
      fetcher,
      map: (raw: { value: number }) => raw.value * 2,
    };

    await cachedResource(options);
    await cachedResource(options);
    expect(fetcher).toHaveBeenCalledTimes(1);

    await cachedResource({ ...options, force: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it("leaves the good copy in place when a forced rebuild fails", async () => {
    await cachedComputation({
      key: "warm-me",
      type: "esports-test",
      ttlDays: TTL.standings,
      compute: async () => ({ answer: 42 }),
    });

    const result = await cachedComputation({
      key: "warm-me",
      type: "esports-test",
      ttlDays: TTL.standings,
      force: true,
      compute: async () => {
        throw new Error("feed is down");
      },
    });

    // A warm run that fails must never be worse than not running.
    expect(result).toEqual({ answer: 42 });
    expect(store.get("esports:warm-me:last-good")).toEqual({ answer: 42 });
  });
});
