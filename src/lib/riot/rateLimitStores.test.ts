import { describe, it, expect, vi } from "vitest";
import { FallbackWindowStore, MemoryWindowStore, UpstashWindowStore } from "./rateLimitStores";

const PERSONAL = [
  { limit: 2, windowMs: 1_000 },
  { limit: 3, windowMs: 120_000 },
];

describe("MemoryWindowStore", () => {
  it("allows up to the short limit, then says how long until the oldest slot frees", async () => {
    const store = new MemoryWindowStore();
    expect(await store.take("euw1", PERSONAL, 0)).toBe(0);
    expect(await store.take("euw1", PERSONAL, 100)).toBe(0);
    expect(await store.take("euw1", PERSONAL, 200)).toBe(800);
  });

  it("honours the long window even when the short one has room", async () => {
    const store = new MemoryWindowStore();
    await store.take("euw1", PERSONAL, 0);
    await store.take("euw1", PERSONAL, 1_000);
    await store.take("euw1", PERSONAL, 2_000);
    // The one-second window is empty again; the two-minute one is full until the first falls out.
    expect(await store.take("euw1", PERSONAL, 5_000)).toBe(115_000);
  });

  it("takes nothing when it refuses, so a refusal does not use up budget", async () => {
    const store = new MemoryWindowStore();
    await store.take("euw1", PERSONAL, 0);
    await store.take("euw1", PERSONAL, 0);
    await store.take("euw1", PERSONAL, 10); // refused
    await store.take("euw1", PERSONAL, 10); // refused
    expect(await store.take("euw1", PERSONAL, 1_000)).toBe(0);
  });

  it("keeps regions apart", async () => {
    const store = new MemoryWindowStore();
    await store.take("euw1", PERSONAL, 0);
    await store.take("euw1", PERSONAL, 0);
    expect(await store.take("na1", PERSONAL, 0)).toBe(0);
  });

  it("holds a paused region shut until the pause runs out", async () => {
    const store = new MemoryWindowStore();
    await store.pause("euw1", 30_000, 0);
    expect(await store.take("euw1", PERSONAL, 10_000)).toBe(20_000);
    expect(await store.take("euw1", PERSONAL, 30_000)).toBe(0);
  });
});

describe("UpstashWindowStore", () => {
  function fakes(results: Record<string, { success: boolean; reset: number }>, pttl = -2) {
    const calls: string[] = [];
    const redis = { set: vi.fn(async () => "OK"), pttl: vi.fn(async () => pttl) };
    const store = new UpstashWindowStore(redis, (w) => ({
      limit: async () => {
        calls.push(`${w.limit}:${w.windowMs}`);
        return results[`${w.limit}:${w.windowMs}`] ?? { success: true, reset: 0 };
      },
    }));
    return { store, redis, calls };
  }

  it("checks windows in order and stops at the first refusal", async () => {
    const { store, calls } = fakes({ "2:1000": { success: false, reset: 1_400 } });
    expect(await store.take("euw1", PERSONAL, 1_000)).toBe(400);
    expect(calls).toEqual(["2:1000"]);
  });

  it("takes a slot when every window has room", async () => {
    const { store, calls } = fakes({});
    expect(await store.take("euw1", PERSONAL, 0)).toBe(0);
    expect(calls).toEqual(["2:1000", "3:120000"]);
  });

  it("reports a shared pause before counting anything", async () => {
    const { store, calls } = fakes({}, 12_000);
    expect(await store.take("euw1", PERSONAL, 0)).toBe(12_000);
    expect(calls).toEqual([]);
  });

  it("writes a pause every instance can see", async () => {
    const { store, redis } = fakes({});
    await store.pause("euw1", 30_000);
    expect(redis.set).toHaveBeenCalledWith("riot-app:pause:euw1", "1", { px: 30_000 });
  });
});

describe("FallbackWindowStore", () => {
  it("counts in memory when the shared store throws", async () => {
    const broken = {
      take: vi.fn(async () => {
        throw new Error("redis down");
      }),
      pause: vi.fn(async () => {
        throw new Error("redis down");
      }),
    };
    const store = new FallbackWindowStore(broken, new MemoryWindowStore());

    expect(await store.take("euw1", PERSONAL, 0)).toBe(0);
    await store.pause("euw1", 5_000, 0);
    expect(await store.take("euw1", PERSONAL, 1_000)).toBe(4_000);
  });

  it("uses memory alone when nothing shared is configured", async () => {
    const store = new FallbackWindowStore(null, new MemoryWindowStore());
    expect(await store.take("euw1", PERSONAL, 0)).toBe(0);
  });
});
