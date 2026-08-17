import { describe, it, expect } from "vitest";
import { computeFreeSlots, openWindows } from "@/domains/marketplace/slots";
import type { WeeklyRule } from "@/domains/marketplace/slots";
import type { Interval } from "@/domains/marketplace/intervals";

const iv = (start: string, end: string): Interval => ({
  start: new Date(start),
  end: new Date(end),
});

const starts = (slots: Interval[]): string[] => slots.map((s) => s.start.toISOString());

/** Mon–Fri, 18:00–21:00 local. */
const EVENINGS: WeeklyRule[] = [{ days: [1, 2, 3, 4, 5], startMinute: 1080, endMinute: 1260 }];

const BASE = {
  rules: EVENINGS,
  exceptions: [],
  busy: [],
  timeZone: "Europe/Istanbul",
  durationMinutes: 60,
  slotIntervalMinutes: 60,
  minimumNoticeMinutes: 0,
  now: new Date("2026-08-01T00:00:00Z"),
};

describe("computeFreeSlots", () => {
  it("offers a slot per interval inside the window", () => {
    const slots = computeFreeSlots({
      ...BASE,
      from: new Date("2026-08-17T00:00:00Z"), // Monday
      to: new Date("2026-08-18T00:00:00Z"),
    });

    // 18:00, 19:00 and 20:00 in Istanbul (UTC+3) are 15:00, 16:00 and 17:00Z.
    expect(starts(slots)).toEqual([
      "2026-08-17T15:00:00.000Z",
      "2026-08-17T16:00:00.000Z",
      "2026-08-17T17:00:00.000Z",
    ]);
  });

  it("offers nothing on a day the rules do not cover", () => {
    const slots = computeFreeSlots({
      ...BASE,
      from: new Date("2026-08-15T00:00:00Z"), // Saturday
      to: new Date("2026-08-16T00:00:00Z"),
    });
    expect(slots).toEqual([]);
  });

  it("never offers a slot that would run past the window", () => {
    const slots = computeFreeSlots({
      ...BASE,
      durationMinutes: 120,
      from: new Date("2026-08-17T00:00:00Z"),
      to: new Date("2026-08-18T00:00:00Z"),
    });
    // A two-hour session fits at 18:00 and 19:00, not at 20:00.
    expect(starts(slots)).toEqual([
      "2026-08-17T15:00:00.000Z",
      "2026-08-17T16:00:00.000Z",
    ]);
  });

  it("removes time that is already booked", () => {
    const slots = computeFreeSlots({
      ...BASE,
      busy: [iv("2026-08-17T16:00:00.000Z", "2026-08-17T17:00:00.000Z")],
      from: new Date("2026-08-17T00:00:00Z"),
      to: new Date("2026-08-18T00:00:00Z"),
    });
    expect(starts(slots)).toEqual([
      "2026-08-17T15:00:00.000Z",
      "2026-08-17T17:00:00.000Z",
    ]);
  });

  it("removes a slot a booking merely overlaps", () => {
    const slots = computeFreeSlots({
      ...BASE,
      busy: [iv("2026-08-17T15:30:00.000Z", "2026-08-17T15:45:00.000Z")],
      from: new Date("2026-08-17T00:00:00Z"),
      to: new Date("2026-08-18T00:00:00Z"),
    });
    // 18:00 local no longer fits an hour, but 18:45 onward does — and the step
    // realigns to the free window rather than to the clock.
    expect(starts(slots)).toEqual([
      "2026-08-17T15:45:00.000Z",
      "2026-08-17T16:45:00.000Z",
    ]);
  });

  it("honours minimum notice", () => {
    const slots = computeFreeSlots({
      ...BASE,
      minimumNoticeMinutes: 120,
      now: new Date("2026-08-17T14:30:00Z"),
      from: new Date("2026-08-17T00:00:00Z"),
      to: new Date("2026-08-18T00:00:00Z"),
    });
    // 15:00Z and 16:00Z are inside the two-hour notice; 17:00Z is not.
    expect(starts(slots)).toEqual(["2026-08-17T17:00:00.000Z"]);
  });

  it("returns nothing for a zero-length session", () => {
    expect(
      computeFreeSlots({
        ...BASE,
        durationMinutes: 0,
        from: new Date("2026-08-17T00:00:00Z"),
        to: new Date("2026-08-18T00:00:00Z"),
      })
    ).toEqual([]);
  });

  describe("timezones", () => {
    /**
     * The reason `timezone.ts` exists. The same 18:00–21:00 rule is a different
     * UTC window on either side of a DST boundary, and a rule collapsed to one
     * fixed offset would put every slot an hour out for half the year.
     */
    it("shifts a fixed local window across a DST boundary", () => {
      const before = computeFreeSlots({
        ...BASE,
        timeZone: "Europe/London",
        now: new Date("2026-03-01T00:00:00Z"),
        from: new Date("2026-03-27T00:00:00Z"), // Friday, GMT
        to: new Date("2026-03-28T00:00:00Z"),
      });
      const after = computeFreeSlots({
        ...BASE,
        timeZone: "Europe/London",
        now: new Date("2026-03-01T00:00:00Z"),
        from: new Date("2026-03-30T00:00:00Z"), // Monday, BST
        to: new Date("2026-03-31T00:00:00Z"),
      });

      expect(starts(before)[0]).toBe("2026-03-27T18:00:00.000Z");
      expect(starts(after)[0]).toBe("2026-03-30T17:00:00.000Z");
    });

    it("keeps offering the same local hours on the transition day itself", () => {
      const slots = computeFreeSlots({
        ...BASE,
        timeZone: "Europe/London",
        rules: [{ days: [0], startMinute: 540, endMinute: 720 }], // Sunday 09:00–12:00
        now: new Date("2026-03-01T00:00:00Z"),
        from: new Date("2026-03-29T00:00:00Z"),
        to: new Date("2026-03-30T00:00:00Z"),
      });
      // Clocks went forward at 01:00, so 09:00 local is 08:00Z.
      expect(starts(slots)).toEqual([
        "2026-03-29T08:00:00.000Z",
        "2026-03-29T09:00:00.000Z",
        "2026-03-29T10:00:00.000Z",
      ]);
    });

    // The clock never showed 01:30 that morning, so nobody could have arrived
    // for it — the window is dropped rather than silently moved.
    it("drops a window that starts inside the spring-forward gap", () => {
      const windows = openWindows({
        rules: [{ days: [0], startMinute: 90, endMinute: 150 }], // 01:30–02:30
        exceptions: [],
        timeZone: "Europe/London",
        from: new Date("2026-03-29T00:00:00Z"),
        to: new Date("2026-03-29T23:00:00Z"),
      });
      expect(windows).toEqual([]);
    });

    it("works west of UTC too", () => {
      const slots = computeFreeSlots({
        ...BASE,
        timeZone: "America/New_York",
        from: new Date("2026-08-17T00:00:00Z"),
        to: new Date("2026-08-19T00:00:00Z"),
      });
      // 18:00 EDT on the 17th is 22:00Z the same day.
      expect(starts(slots)[0]).toBe("2026-08-17T22:00:00.000Z");
    });
  });

  describe("exceptions", () => {
    it("closes a day entirely", () => {
      const slots = computeFreeSlots({
        ...BASE,
        exceptions: [{ date: "2026-08-17", isBlocked: true, startMinute: null, endMinute: null }],
        from: new Date("2026-08-17T00:00:00Z"),
        to: new Date("2026-08-18T00:00:00Z"),
      });
      expect(slots).toEqual([]);
    });

    it("replaces a day's hours rather than adding to them", () => {
      const slots = computeFreeSlots({
        ...BASE,
        exceptions: [
          { date: "2026-08-17", isBlocked: false, startMinute: 600, endMinute: 720 },
        ],
        from: new Date("2026-08-17T00:00:00Z"),
        to: new Date("2026-08-18T00:00:00Z"),
      });
      // 10:00–12:00 Istanbul only — the usual evening rule does not also apply.
      expect(starts(slots)).toEqual([
        "2026-08-17T07:00:00.000Z",
        "2026-08-17T08:00:00.000Z",
      ]);
    });

    it("opens a day the weekly rules leave closed", () => {
      const slots = computeFreeSlots({
        ...BASE,
        exceptions: [
          { date: "2026-08-15", isBlocked: false, startMinute: 600, endMinute: 660 },
        ],
        from: new Date("2026-08-15T00:00:00Z"), // Saturday
        to: new Date("2026-08-16T00:00:00Z"),
      });
      expect(starts(slots)).toEqual(["2026-08-15T07:00:00.000Z"]);
    });
  });
});
