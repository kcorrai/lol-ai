import { describe, expect, it } from "vitest";
import { isComplete, MAX_LEVEL, skillGrid } from "./skillGrid";

/** Levels, one-based, where a row is marked — easier to read than eighteen booleans. */
function marked(levels: boolean[]): number[] {
  return levels.flatMap((on, i) => (on ? [i + 1] : []));
}

const FULL = [
  "Q", "W", "E", "Q", "Q", "R", "Q", "W", "Q", "W", "R", "W", "W", "E", "E", "R", "E", "E",
];

describe("skillGrid", () => {
  it("gives a row per ability, in the order every client lists them", () => {
    expect(skillGrid(FULL).map((r) => r.ability)).toEqual(["Q", "W", "E", "R"]);
  });

  it("marks the levels each ability is taken at", () => {
    const grid = skillGrid(FULL);
    expect(marked(grid[0]!.levels)).toEqual([1, 4, 5, 7, 9]);
    expect(marked(grid[3]!.levels)).toEqual([6, 11, 16]);
  });

  it("makes every row the full width, however short the order", () => {
    for (const row of skillGrid(["Q", "W"])) {
      expect(row.levels).toHaveLength(MAX_LEVEL);
    }
  });

  it("leaves the tail empty for the fifteen-long order op.gg publishes", () => {
    const grid = skillGrid(FULL.slice(0, 15));
    expect(grid.every((r) => r.levels.slice(15).every((on) => !on))).toBe(true);
  });

  it("accepts a lowercase order without redrawing it as empty", () => {
    expect(marked(skillGrid(["q", "w", "e"])[0]!.levels)).toEqual([1]);
  });

  it("skips a letter it does not know rather than guessing a row", () => {
    const grid = skillGrid(["Q", "X", "W"]);
    expect(marked(grid[0]!.levels)).toEqual([1]);
    expect(marked(grid[1]!.levels)).toEqual([3]);
  });

  it("ignores anything past level eighteen", () => {
    const grid = skillGrid([...FULL, "Q"]);
    expect(marked(grid[0]!.levels)).toEqual([1, 4, 5, 7, 9]);
  });

  it("renders an empty order as an empty grid rather than throwing", () => {
    expect(skillGrid([]).every((r) => r.levels.every((on) => !on))).toBe(true);
  });
});

describe("isComplete", () => {
  it("is true for all eighteen levels", () => {
    expect(isComplete(FULL)).toBe(true);
  });

  it("is false for the fifteen op.gg gives, so the panel can say where it stops", () => {
    expect(isComplete(FULL.slice(0, 15))).toBe(false);
  });

  it("does not count letters it cannot place", () => {
    expect(isComplete([...FULL.slice(0, 15), "X", "X", "X"])).toBe(false);
  });
});
