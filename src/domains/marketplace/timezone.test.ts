import { describe, it, expect } from "vitest";
import {
  wallTimeIn,
  offsetMsAt,
  instantFromWallTime,
  existsInZone,
  dateKey,
  localDatesBetween,
  isValidTimeZone,
} from "@/domains/marketplace/timezone";

const HOUR = 3_600_000;

describe("offsetMsAt", () => {
  // Turkey has been on permanent UTC+3 since 2016, which makes it the control
  // case: if this drifts, the bug is in the maths and not in a DST rule.
  it("reads a fixed-offset zone the same in January and July", () => {
    expect(offsetMsAt(new Date("2026-01-15T12:00:00Z"), "Europe/Istanbul")).toBe(3 * HOUR);
    expect(offsetMsAt(new Date("2026-07-15T12:00:00Z"), "Europe/Istanbul")).toBe(3 * HOUR);
  });

  it("reads UTC as zero", () => {
    expect(offsetMsAt(new Date("2026-06-01T00:00:00Z"), "UTC")).toBe(0);
  });

  it("follows a zone across its DST boundary", () => {
    // EU clocks go forward on 29 March 2026 and back on 25 October 2026.
    expect(offsetMsAt(new Date("2026-03-28T12:00:00Z"), "Europe/London")).toBe(0);
    expect(offsetMsAt(new Date("2026-03-30T12:00:00Z"), "Europe/London")).toBe(HOUR);
    expect(offsetMsAt(new Date("2026-10-26T12:00:00Z"), "Europe/London")).toBe(0);
  });

  it("handles a western zone as a negative offset", () => {
    expect(offsetMsAt(new Date("2026-01-15T12:00:00Z"), "America/New_York")).toBe(-5 * HOUR);
    expect(offsetMsAt(new Date("2026-07-15T12:00:00Z"), "America/New_York")).toBe(-4 * HOUR);
  });
});

describe("instantFromWallTime", () => {
  it("resolves a wall time in a fixed-offset zone", () => {
    const instant = instantFromWallTime(
      { year: 2026, month: 8, day: 17, hour: 18, minute: 0 },
      "Europe/Istanbul"
    );
    expect(instant.toISOString()).toBe("2026-08-17T15:00:00.000Z");
  });

  /**
   * The reason this module exists. The same weekly rule — 09:00 local — is a
   * different UTC instant either side of the boundary, so a rule baked down to
   * one offset is wrong for half the year.
   */
  it("gives the same wall time different instants across a DST boundary", () => {
    const winter = instantFromWallTime(
      { year: 2026, month: 3, day: 28, hour: 9, minute: 0 },
      "Europe/London"
    );
    const summer = instantFromWallTime(
      { year: 2026, month: 3, day: 30, hour: 9, minute: 0 },
      "Europe/London"
    );

    expect(winter.toISOString()).toBe("2026-03-28T09:00:00.000Z");
    expect(summer.toISOString()).toBe("2026-03-30T08:00:00.000Z");
  });

  it("round-trips every hour of a DST-transition day", () => {
    for (const day of [29, 30]) {
      for (let hour = 3; hour < 24; hour += 1) {
        const wall = { year: 2026, month: 3, day, hour, minute: 0 };
        const back = wallTimeIn(instantFromWallTime(wall, "Europe/London"), "Europe/London");
        expect({ hour: back.hour, day: back.day }).toEqual({ hour, day });
      }
    }
  });

  it("round-trips across an autumn transition too", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      const wall = { year: 2026, month: 10, day: 25, hour, minute: 30 };
      const back = wallTimeIn(instantFromWallTime(wall, "Europe/London"), "Europe/London");
      expect(back.hour).toBe(hour);
    }
  });

  // 01:00–02:00 does not happen on 29 March 2026 in London; the clock jumps
  // straight from 00:59 to 02:00.
  it("returns the jump target for a wall time inside the spring-forward gap", () => {
    const instant = instantFromWallTime(
      { year: 2026, month: 3, day: 29, hour: 1, minute: 30 },
      "Europe/London"
    );
    expect(wallTimeIn(instant, "Europe/London").hour).toBe(2);
  });

  it("takes the earlier of the two occurrences in an autumn overlap", () => {
    // 01:30 happens twice on 25 October 2026 in London: once at 00:30Z (BST)
    // and again at 01:30Z (GMT). A person expecting 01:30 arrives at the first.
    const instant = instantFromWallTime(
      { year: 2026, month: 10, day: 25, hour: 1, minute: 30 },
      "Europe/London"
    );
    expect(instant.toISOString()).toBe("2026-10-25T00:30:00.000Z");
  });
});

describe("existsInZone", () => {
  it("is false only inside the gap", () => {
    expect(
      existsInZone({ year: 2026, month: 3, day: 29, hour: 1, minute: 30 }, "Europe/London")
    ).toBe(false);
    expect(
      existsInZone({ year: 2026, month: 3, day: 29, hour: 3, minute: 0 }, "Europe/London")
    ).toBe(true);
    expect(
      existsInZone({ year: 2026, month: 3, day: 28, hour: 1, minute: 30 }, "Europe/London")
    ).toBe(true);
  });

  it("is always true in a zone with no DST", () => {
    for (let hour = 0; hour < 24; hour += 1) {
      expect(
        existsInZone({ year: 2026, month: 3, day: 29, hour, minute: 0 }, "Europe/Istanbul")
      ).toBe(true);
    }
  });
});

describe("localDatesBetween", () => {
  it("lists each local day once", () => {
    const days = localDatesBetween(
      new Date("2026-08-17T00:00:00Z"),
      new Date("2026-08-20T00:00:00Z"),
      "Europe/Istanbul"
    );
    expect(days.map(dateKey)).toEqual(["2026-08-17", "2026-08-18", "2026-08-19", "2026-08-20"]);
  });

  it("neither skips nor repeats a day across a DST transition", () => {
    const days = localDatesBetween(
      new Date("2026-03-27T12:00:00Z"),
      new Date("2026-03-31T12:00:00Z"),
      "Europe/London"
    );
    expect(days.map(dateKey)).toEqual([
      "2026-03-27",
      "2026-03-28",
      "2026-03-29",
      "2026-03-30",
      "2026-03-31",
    ]);
  });

  it("starts from the local day, which may differ from the UTC one", () => {
    // 23:30Z on the 17th is already the 18th in Istanbul.
    const days = localDatesBetween(
      new Date("2026-08-17T23:30:00Z"),
      new Date("2026-08-18T12:00:00Z"),
      "Europe/Istanbul"
    );
    expect(days.map(dateKey)[0]).toBe("2026-08-18");
  });
});

describe("isValidTimeZone", () => {
  it("accepts real zones and rejects invented ones", () => {
    expect(isValidTimeZone("Europe/Istanbul")).toBe(true);
    expect(isValidTimeZone("UTC")).toBe(true);
    expect(isValidTimeZone("Middle/Earth")).toBe(false);
    expect(isValidTimeZone("")).toBe(false);
  });
});
