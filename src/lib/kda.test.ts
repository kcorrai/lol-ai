import { describe, expect, it } from "vitest";
import { aggregateKDA, computeKDA, kdaRatio } from "@/lib/kda";

describe("kdaRatio", () => {
  it("is (kills + assists) over deaths", () => {
    expect(kdaRatio(10, 5, 5)).toBe(3);
  });

  it("floors deaths at one so a deathless game is a ratio, not a division by zero", () => {
    expect(kdaRatio(12, 0, 8)).toBe(20);
    expect(Number.isFinite(kdaRatio(1, 0, 0))).toBe(true);
  });

  // Several call sites had written `deaths > 0 ? (k + a) / deaths : k + a` out longhand. The claim
  // that this differs from the floor form is wrong — at zero deaths both give kills + assists —
  // and this is that equivalence pinned down, since it is why they could be consolidated.
  it("agrees with the longhand form at every death count, zero included", () => {
    for (const [k, d, a] of [[10, 0, 5], [10, 1, 5], [0, 0, 0], [7, 3, 9], [1, 12, 30]]) {
      const longhand = d > 0 ? (k + a) / d : k + a;
      expect(kdaRatio(k, d, a)).toBe(longhand);
    }
  });

  it("does not round, so callers can average or format it themselves", () => {
    expect(kdaRatio(10, 3, 0)).toBeCloseTo(3.3333, 4);
  });
});

describe("computeKDA", () => {
  it("rounds the ratio to two places", () => {
    expect(computeKDA(10, 3, 0)).toBe(3.33);
  });

  it("returns a number, not a string with trailing zeroes", () => {
    expect(computeKDA(10, 5, 0)).toBe(2);
  });

  it("matches the Math.round(x * 100) / 100 form the overlay used to do by hand", () => {
    for (const [k, d, a] of [[7, 3, 9], [10, 3, 0], [1, 7, 2], [0, 1, 0]]) {
      expect(computeKDA(k, d, a)).toBe(Math.round(((k + a) / Math.max(d, 1)) * 100) / 100);
    }
  });
});

describe("aggregateKDA", () => {
  // The ratio of the sums, not the mean of each game's ratio: one deathless game scores 20+ under
  // the floor and would drag the mean of a hundred games with it.
  it("is the ratio of the sums", () => {
    expect(aggregateKDA(100, 40, 60)).toBe(4);
  });

  it("is not the mean of per-game ratios", () => {
    // Two games: (10/0/0) and (0/10/0). Ratio of sums is 1; mean of ratios is 10.
    expect(aggregateKDA(10, 10, 0)).toBe(1);
  });
});
