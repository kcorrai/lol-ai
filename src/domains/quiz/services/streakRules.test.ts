import { describe, it, expect } from "vitest";
import {
  FREEZES_PER_WEEK,
  INITIAL_STREAK,
  advanceStreak,
  isoWeekKey,
  streakStatus,
  type StreakState,
} from "./streakRules";

function state(overrides: Partial<StreakState> = {}): StreakState {
  return { ...INITIAL_STREAK, ...overrides };
}

describe("isoWeekKey", () => {
  it("keeps a Monday-to-Sunday week together", () => {
    // 2026-08-17 is a Monday; the Sunday that closes that week is 2026-08-23.
    expect(isoWeekKey("2026-08-17")).toBe(isoWeekKey("2026-08-23"));
  });

  it("starts a new key on the following Monday", () => {
    expect(isoWeekKey("2026-08-23")).not.toBe(isoWeekKey("2026-08-24"));
  });

  it("puts a year-boundary week in the ISO year its Thursday falls in", () => {
    // 2027-01-01 is a Friday, so it belongs to the last ISO week of 2026.
    expect(isoWeekKey("2027-01-01")).toBe(isoWeekKey("2026-12-28"));
  });
});

describe("advanceStreak", () => {
  it("starts a streak at one", () => {
    expect(advanceStreak(state(), "2026-08-17").current).toBe(1);
  });

  it("counts a consecutive day", () => {
    const day1 = advanceStreak(state(), "2026-08-17");
    expect(advanceStreak(day1, "2026-08-18").current).toBe(2);
  });

  it("does not advance twice on the same day", () => {
    // Solving a second mode must not count again.
    const once = advanceStreak(state(), "2026-08-17");
    expect(advanceStreak(once, "2026-08-17")).toEqual(once);
  });

  it("tracks the longest streak the player has ever had", () => {
    let s = state();
    for (const d of ["2026-08-17", "2026-08-18", "2026-08-19"]) s = advanceStreak(s, d);
    s = advanceStreak(s, "2026-09-01"); // long gap, resets to 1
    expect(s.current).toBe(1);
    expect(s.longest).toBe(3);
  });

  describe("the weekly freeze", () => {
    it("forgives exactly one missed day", () => {
      const before = advanceStreak(state(), "2026-08-17");
      const after = advanceStreak(before, "2026-08-19"); // skipped the 18th
      expect(after.current).toBe(2);
      expect(after.freezesLeft).toBe(0);
    });

    it("cannot forgive a second missed day in the same week", () => {
      let s = advanceStreak(state(), "2026-08-17");
      s = advanceStreak(s, "2026-08-19"); // freeze spent
      s = advanceStreak(s, "2026-08-21"); // skipped the 20th, nothing left
      expect(s.current).toBe(1);
    });

    it("does not forgive two missed days in a row", () => {
      const before = advanceStreak(state(), "2026-08-17");
      const after = advanceStreak(before, "2026-08-20"); // missed the 18th and 19th
      expect(after.current).toBe(1);
      expect(after.freezesLeft).toBe(FREEZES_PER_WEEK);
    });

    it("refills the allowance in a new week", () => {
      let s = advanceStreak(state(), "2026-08-17"); // Monday
      s = advanceStreak(s, "2026-08-19"); // freeze spent
      expect(s.freezesLeft).toBe(0);
      s = advanceStreak(s, "2026-08-24"); // the next Monday
      expect(s.freezesLeft).toBe(FREEZES_PER_WEEK);
    });
  });

  it("ignores a date earlier than the last one recorded", () => {
    // Clock skew or a backfill must not be able to corrupt a live streak.
    const s = advanceStreak(state(), "2026-08-17");
    expect(advanceStreak(s, "2026-08-10").current).toBe(s.current);
    expect(advanceStreak(s, "2026-08-10").lastPlayedDate).toBe("2026-08-17");
  });

  it("survives a month boundary", () => {
    const s = advanceStreak(state(), "2026-08-31");
    expect(advanceStreak(s, "2026-09-01").current).toBe(2);
  });

  it("survives a leap day", () => {
    const s = advanceStreak(state(), "2028-02-28");
    expect(advanceStreak(s, "2028-02-29").current).toBe(2);
  });

  it("builds a long streak day after day", () => {
    let s = state();
    let day = new Date(Date.UTC(2026, 0, 1));
    for (let i = 0; i < 100; i++) {
      s = advanceStreak(s, day.toISOString().slice(0, 10));
      day = new Date(day.getTime() + 86_400_000);
    }
    expect(s.current).toBe(100);
    expect(s.longest).toBe(100);
  });
});

describe("streakStatus", () => {
  it("is current on the day it was last played", () => {
    const s = advanceStreak(state(), "2026-08-17");
    expect(streakStatus(s, "2026-08-17")).toBe("current");
  });

  it("is at risk the day after, while it can still be saved", () => {
    const s = advanceStreak(state(), "2026-08-17");
    expect(streakStatus(s, "2026-08-18")).toBe("at-risk");
  });

  it("is still at risk two days on when a freeze can cover it", () => {
    const s = advanceStreak(state(), "2026-08-17");
    expect(s.freezesLeft).toBe(FREEZES_PER_WEEK);
    expect(streakStatus(s, "2026-08-19")).toBe("at-risk");
  });

  it("is broken two days on once the freeze is spent", () => {
    let s = advanceStreak(state(), "2026-08-17");
    s = advanceStreak(s, "2026-08-19"); // spends the freeze
    expect(streakStatus(s, "2026-08-21")).toBe("broken");
  });

  it("is broken when nothing has ever been played", () => {
    expect(streakStatus(state(), "2026-08-17")).toBe("broken");
  });
});
