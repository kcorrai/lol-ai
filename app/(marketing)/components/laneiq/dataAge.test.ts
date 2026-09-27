import { describe, it, expect } from "vitest";
import { isStale, relativeAge } from "./dataAge";

const NOW = Date.parse("2026-09-27T12:00:00Z");
const hoursAgo = (h: number): string => new Date(NOW - h * 3_600_000).toISOString();

describe("isStale", () => {
  it("treats a snapshot from this morning as fresh", () => {
    expect(isStale(hoursAgo(10), NOW)).toBe(false);
  });

  it("forgives a missed daily run or two", () => {
    expect(isStale(hoursAgo(71), NOW)).toBe(false);
  });

  it("calls anything past three days stale", () => {
    expect(isStale(hoursAgo(73), NOW)).toBe(true);
    expect(isStale(hoursAgo(22 * 24), NOW)).toBe(true);
  });
});

describe("relativeAge", () => {
  it("counts minutes, never zero", () => {
    expect(relativeAge(new Date(NOW).toISOString(), NOW)).toBe("1m");
    expect(relativeAge(hoursAgo(0.5), NOW)).toBe("30m");
  });

  it("switches to hours, then days past 48h", () => {
    expect(relativeAge(hoursAgo(5), NOW)).toBe("5h");
    expect(relativeAge(hoursAgo(47), NOW)).toBe("47h");
    expect(relativeAge(hoursAgo(72), NOW)).toBe("3d");
  });
});
