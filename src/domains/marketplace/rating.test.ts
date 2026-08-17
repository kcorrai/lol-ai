import { describe, it, expect } from "vitest";
import {
  bayesianAverage,
  wilsonLowerBound,
  aggregateRatings,
  MIN_REVIEWS_FOR_SCORE,
} from "@/domains/marketplace/rating";

const sum = (ratings: number[]) => ratings.reduce((a, b) => a + b, 0);

describe("bayesianAverage", () => {
  it("is the platform mean when there is nothing to go on", () => {
    expect(bayesianAverage(0, 0, 4.5)).toBe(4.5);
  });

  // Without the prior, one five-star review outranks everybody.
  it("pulls a single perfect review back toward the platform", () => {
    const one = bayesianAverage(5, 1, 4.5);
    expect(one).toBeGreaterThan(4.5);
    expect(one).toBeLessThan(5);
  });

  it("lets a real sample outweigh the prior", () => {
    const few = bayesianAverage(sum([5, 5, 5]), 3, 4.5);
    const many = bayesianAverage(sum(Array(50).fill(5)), 50, 4.5);

    expect(many).toBeGreaterThan(few);
    expect(many).toBeGreaterThan(4.9);
  });

  it("pulls a single terrible review up, for the same reason", () => {
    const one = bayesianAverage(1, 1, 4.5);
    expect(one).toBeGreaterThan(1);
    expect(one).toBeLessThan(4.5);
  });

  it("stays inside the scale whatever it is given", () => {
    for (const [s, c] of [[5, 1], [500, 100], [100, 100], [1, 1]] as const) {
      const value = bayesianAverage(s, c, 4.5);
      expect(value).toBeGreaterThanOrEqual(1);
      expect(value).toBeLessThanOrEqual(5);
    }
  });
});

describe("wilsonLowerBound", () => {
  it("is zero with no reviews, so ordering never has a hole", () => {
    expect(wilsonLowerBound(0, 0)).toBe(0);
  });

  /**
   * The whole reason search does not order by the displayed average: a 5.0 from
   * two people must not outrank a 4.8 from ninety.
   */
  it("ranks a large good sample above a small perfect one", () => {
    const twoPerfect = wilsonLowerBound(sum([5, 5]), 2);
    const ninetyGood = wilsonLowerBound(4.8 * 90, 90);

    expect(ninetyGood).toBeGreaterThan(twoPerfect);
  });

  it("rises as the same average gathers more reviews", () => {
    const ten = wilsonLowerBound(5 * 10, 10);
    const hundred = wilsonLowerBound(5 * 100, 100);

    expect(hundred).toBeGreaterThan(ten);
  });

  it("puts a bad coach below a good one at the same sample size", () => {
    expect(wilsonLowerBound(2 * 20, 20)).toBeLessThan(wilsonLowerBound(4.5 * 20, 20));
  });

  it("never leaves 0..1", () => {
    for (const [s, c] of [[5, 1], [1, 1], [5 * 500, 500], [3 * 7, 7]] as const) {
      const value = wilsonLowerBound(s, c);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  });
});

describe("aggregateRatings", () => {
  // One five-star review is not a rating, and showing it as one is how a
  // marketplace's numbers stop meaning anything.
  it("shows no number below the threshold, but still sorts", () => {
    const result = aggregateRatings([5, 5]);

    expect(result.display).toBeNull();
    expect(result.count).toBe(2);
    expect(result.sort).toBeGreaterThan(0);
  });

  it("starts showing a number at the threshold", () => {
    const result = aggregateRatings(Array(MIN_REVIEWS_FOR_SCORE).fill(5));
    expect(result.display).not.toBeNull();
  });

  it("rounds the displayed score to two places", () => {
    const result = aggregateRatings([5, 4, 3, 5, 4]);
    expect(result.display).toBe(Math.round((result.display as number) * 100) / 100);
  });

  it("handles an empty set without dividing by zero", () => {
    const result = aggregateRatings([]);
    expect(result).toEqual({ display: null, sort: 0, count: 0 });
  });
});
