import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryCacheStore } from "@/lib/riot/cache";

afterEach(() => vi.useRealTimers());

describe("MemoryCacheStore", () => {
  it("returns what was stored", async () => {
    const c = new MemoryCacheStore(10);
    await c.set("k", { a: 1 }, 60);
    await expect(c.get("k")).resolves.toEqual({ a: 1 });
  });

  it("misses an absent key", async () => {
    const c = new MemoryCacheStore(10);
    await expect(c.get("nope")).resolves.toBeNull();
  });

  it("expires an entry once its ttl has passed", async () => {
    vi.useFakeTimers();
    const c = new MemoryCacheStore(10);
    await c.set("k", "v", 60);

    vi.advanceTimersByTime(61_000);

    await expect(c.get("k")).resolves.toBeNull();
  });

  it("forgets a deleted key", async () => {
    const c = new MemoryCacheStore(10);
    await c.set("k", "v", 60);
    await c.del("k");
    await expect(c.get("k")).resolves.toBeNull();
  });

  describe("bounding", () => {
    // Expiry is lazy — an entry is only checked when somebody asks for that key — so before this
    // bound existed, anything written and never read again stayed for the life of the process. On
    // Fluid Compute, instances are long-lived and reused, so that grew without limit.
    it("never holds more than its maximum", async () => {
      const c = new MemoryCacheStore(5);
      for (let i = 0; i < 50; i++) await c.set(`k${i}`, i, 60);

      expect(c.size).toBe(5);
    });

    it("sheds the least recently used, not the least recently written", async () => {
      const c = new MemoryCacheStore(3);
      await c.set("a", 1, 60);
      await c.set("b", 2, 60);
      await c.set("c", 3, 60);

      // Reading `a` should save it from being the next thing evicted.
      await c.get("a");
      await c.set("d", 4, 60);

      await expect(c.get("a")).resolves.toBe(1);
      await expect(c.get("b")).resolves.toBeNull();
    });

    it("drops expired entries before evicting anything still live", async () => {
      vi.useFakeTimers();
      const c = new MemoryCacheStore(3);
      await c.set("stale1", 1, 1);
      await c.set("stale2", 2, 1);

      vi.advanceTimersByTime(5_000);

      await c.set("fresh1", 3, 600);
      await c.set("fresh2", 4, 600);
      // This one tips it over the bound; the two stale entries should absorb it.
      await c.set("fresh3", 5, 600);

      await expect(c.get("fresh1")).resolves.toBe(3);
      await expect(c.get("fresh2")).resolves.toBe(4);
      await expect(c.get("fresh3")).resolves.toBe(5);
    });

    it("keeps a re-set key rather than counting it twice", async () => {
      const c = new MemoryCacheStore(3);
      await c.set("a", 1, 60);
      await c.set("a", 2, 60);
      await c.set("b", 3, 60);

      expect(c.size).toBe(2);
      await expect(c.get("a")).resolves.toBe(2);
    });
  });
});
