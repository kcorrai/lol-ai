import { describe, expect, it } from "vitest";
import {
  elapsedSeconds,
  formatDuration,
  meanDuration,
  perMinute,
} from "@/domains/esports/duration";

describe("elapsedSeconds", () => {
  it("measures a real game from its first and last published frame", () => {
    // The three games of Otter Side vs NORTHERNGRADE, as the feed published
    // them — the pair this whole derivation was verified against.
    expect(elapsedSeconds("2026-08-13T18:42:04.012Z", "2026-08-13T19:16:44.565Z")).toBe(2081);
  });

  it("has no answer when either end is missing", () => {
    expect(elapsedSeconds(null, "2026-08-13T19:16:44.565Z")).toBeNull();
    expect(elapsedSeconds("2026-08-13T18:42:04.012Z", undefined)).toBeNull();
  });

  it("has no answer for an unparseable timestamp", () => {
    expect(elapsedSeconds("not a time", "2026-08-13T19:16:44.565Z")).toBeNull();
  });

  it("rejects a span too short to be a game", () => {
    // A duplicated frame would otherwise report a four-second game, and every
    // per-minute rate derived from it would be nonsense.
    expect(elapsedSeconds("2026-08-13T18:42:04.012Z", "2026-08-13T18:42:08.012Z")).toBeNull();
  });

  it("rejects a span too long to be a game", () => {
    expect(elapsedSeconds("2026-08-13T18:42:04Z", "2026-08-13T21:42:04Z")).toBeNull();
  });

  it("rejects an end before its start", () => {
    expect(elapsedSeconds("2026-08-13T19:16:44Z", "2026-08-13T18:42:04Z")).toBeNull();
  });
});

describe("perMinute", () => {
  it("expresses a total over the game's length", () => {
    // 320 CS in 2081 seconds is 9.2/min.
    expect(perMinute(320, 2081)).toBeCloseTo(9.226, 2);
  });

  it("has no answer without a duration", () => {
    expect(perMinute(320, null)).toBeNull();
  });

  it("has no answer without a total", () => {
    expect(perMinute(null, 2081)).toBeNull();
  });

  it("refuses to divide by a zero-length game", () => {
    expect(perMinute(320, 0)).toBeNull();
  });
});

describe("formatDuration", () => {
  it("reads as minutes and padded seconds", () => {
    expect(formatDuration(2081)).toBe("34:41");
  });

  it("pads a single-digit second", () => {
    expect(formatDuration(2043)).toBe("34:03");
  });

  it("does not cap the minutes at an hour", () => {
    expect(formatDuration(3900)).toBe("65:00");
  });

  it("dashes when there is no duration", () => {
    expect(formatDuration(null)).toBe("—");
  });
});

describe("meanDuration", () => {
  it("averages the games that have a length", () => {
    expect(meanDuration([2081, 1534, 1960])).toBeCloseTo(1858.33, 1);
  });

  it("ignores games with no length rather than counting them as zero", () => {
    expect(meanDuration([2081, null, 1534])).toBeCloseTo(1807.5, 1);
  });

  it("has no answer when no game has a length", () => {
    expect(meanDuration([null, null])).toBeNull();
    expect(meanDuration([])).toBeNull();
  });
});
