import { describe, it, expect } from "vitest";
import {
  cellKey,
  gridToRules,
  isHourAligned,
  openHoursPerWeek,
  rulesToGrid,
} from "@/domains/marketplace/availabilityGrid";

describe("rulesToGrid", () => {
  it("lights every hour a rule covers, on every day it names", () => {
    const open = rulesToGrid([{ days: [1, 2], startMinute: 18 * 60, endMinute: 21 * 60 }]);

    expect(open.size).toBe(6);
    expect(open.has(cellKey(1, 18))).toBe(true);
    expect(open.has(cellKey(2, 20))).toBe(true);
    // The end is exclusive: 21:00 is when it stops, not another open hour.
    expect(open.has(cellKey(1, 21))).toBe(false);
  });

  // Hiding a partly-open hour would read as "I closed that", which is the one
  // mistake this grid must not make.
  it("rounds a half-hour rule outwards rather than hiding it", () => {
    const open = rulesToGrid([{ days: [3], startMinute: 18 * 60 + 30, endMinute: 20 * 60 + 30 }]);

    expect([...open].sort()).toEqual(["3:18", "3:19", "3:20"]);
  });
});

describe("gridToRules", () => {
  it("merges days that have the same shape into one rule", () => {
    const open = new Set<string>();
    for (const day of [1, 2, 3, 4, 5]) {
      for (const hour of [18, 19, 20, 21]) open.add(cellKey(day, hour));
    }

    expect(gridToRules(open)).toEqual([
      { days: [1, 2, 3, 4, 5], startMinute: 18 * 60, endMinute: 22 * 60 },
    ]);
  });

  it("splits a day with a gap into two spans", () => {
    const open = new Set([cellKey(6, 10), cellKey(6, 11), cellKey(6, 15), cellKey(6, 16)]);

    expect(gridToRules(open)).toEqual([
      { days: [6], startMinute: 10 * 60, endMinute: 12 * 60 },
      { days: [6], startMinute: 15 * 60, endMinute: 17 * 60 },
    ]);
  });

  it("keeps days apart when their shapes differ", () => {
    const open = new Set([cellKey(1, 18), cellKey(2, 19)]);

    expect(gridToRules(open)).toEqual([
      { days: [1], startMinute: 18 * 60, endMinute: 19 * 60 },
      { days: [2], startMinute: 19 * 60, endMinute: 20 * 60 },
    ]);
  });

  it("returns nothing for an empty week rather than an empty rule", () => {
    expect(gridToRules(new Set())).toEqual([]);
  });

  it("round-trips an hour-aligned pattern unchanged", () => {
    const rules = [
      { days: [1, 2, 3, 4, 5], startMinute: 18 * 60, endMinute: 22 * 60 },
      { days: [0, 6], startMinute: 13 * 60, endMinute: 18 * 60 },
    ];

    expect(gridToRules(rulesToGrid(rules))).toEqual(
      [...rules].sort((a, b) => a.startMinute - b.startMinute)
    );
  });
});

describe("isHourAligned", () => {
  it("is false as soon as one rule sits off the hour", () => {
    expect(isHourAligned([{ days: [1], startMinute: 1080, endMinute: 1260 }])).toBe(true);
    expect(isHourAligned([{ days: [1], startMinute: 1110, endMinute: 1260 }])).toBe(false);
  });
});

describe("openHoursPerWeek", () => {
  it("counts each day a rule names, not the rule once", () => {
    expect(
      openHoursPerWeek([{ days: [1, 2, 3, 4, 5], startMinute: 18 * 60, endMinute: 22 * 60 }])
    ).toBe(20);
  });
});
