import { describe, expect, it } from "vitest";
import { percentile, summarize, type Sample } from "./summarize";

describe("percentile", () => {
  it("takes the nearest rank", () => {
    const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(percentile(values, 50)).toBe(50);
    expect(percentile(values, 95)).toBe(100);
    expect(percentile(values, 1)).toBe(10);
  });

  it("is 0 for no values", () => {
    expect(percentile([], 95)).toBe(0);
  });
});

describe("summarize", () => {
  const sample = (path: string, status: number, ms: number, cache: string | null): Sample => ({
    path,
    status,
    ms,
    cache,
  });

  it("groups by path and counts errors and cache hits", () => {
    const [builds, meta] = summarize([
      sample("/builds", 200, 30, "HIT"),
      sample("/builds", 200, 10, "STALE"),
      sample("/builds", 500, 900, null),
      sample("/builds", 0, 5000, null),
      sample("/meta", 200, 40, "MISS"),
    ]);

    expect(builds).toMatchObject({ path: "/builds", requests: 4, errors: 2, cacheHitRate: 0.5 });
    expect(builds.p50).toBe(30);
    expect(builds.p99).toBe(5000);
    expect(meta).toMatchObject({ path: "/meta", requests: 1, errors: 0, cacheHitRate: 0 });
  });
});
