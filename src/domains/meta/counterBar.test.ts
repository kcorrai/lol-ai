import { describe, it, expect } from "vitest";
import { barWidth, matchupEdge } from "./counterBar";

describe("matchupEdge", () => {
  it("measures distance from an even matchup either way", () => {
    expect(matchupEdge(56.2)).toBeCloseTo(6.2);
    expect(matchupEdge(38.8)).toBeCloseTo(11.2);
  });

  it("gives the worst matchup a bigger edge than a milder one", () => {
    // This is what stops the red column from drawing its worst row as the shortest bar.
    expect(matchupEdge(38.8)).toBeGreaterThan(matchupEdge(45.6));
  });

  it("is zero for a coin-flip", () => {
    expect(matchupEdge(50)).toBe(0);
  });
});

describe("barWidth", () => {
  const values = [56.2, 53.5, 50.1];

  it("gives the top of the range the full bar and the bottom the minimum", () => {
    expect(barWidth(56.2, values)).toBe(100);
    expect(barWidth(50.1, values)).toBe(12);
  });

  it("places a middle value between the two", () => {
    const mid = barWidth(53.5, values);
    expect(mid).toBeGreaterThan(12);
    expect(mid).toBeLessThan(100);
  });

  it("spreads a narrow range across the full width", () => {
    // Counter win rates cluster tightly; on an absolute 0-100 scale these three would be
    // indistinguishable, which is the whole reason for scaling to the column's own range.
    const narrow = [51.2, 51.0, 50.8];
    expect(barWidth(51.2, narrow)).toBe(100);
    expect(barWidth(50.8, narrow)).toBe(12);
  });

  it("does not divide by zero when every row is identical", () => {
    expect(barWidth(50, [50, 50, 50])).toBe(100);
  });

  it("handles a single row", () => {
    expect(barWidth(52, [52])).toBe(100);
  });

  it("falls back to the minimum with no values at all", () => {
    expect(barWidth(50, [])).toBe(12);
  });

  it("clamps a value from outside the range", () => {
    expect(barWidth(99, values)).toBe(100);
    expect(barWidth(1, values)).toBe(12);
  });
});
