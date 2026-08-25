import { describe, expect, it } from "vitest";
import { formatCount, formatDate, formatDateTime, formatTime, UI_LOCALE } from "./uiLocale";

/**
 * These assert on rendered strings, which is usually a brittle thing to do. Here it is the
 * point: the defect was that the string depended on the machine, so a test that only
 * checked "some string came back" would have passed on the broken code.
 */
describe("uiLocale", () => {
  // 2026-08-26T14:05:00Z, built from parts so the test does not depend on the runner's
  // time zone for the date it is about to print.
  const stamp = new Date(2026, 7, 26, 14, 5, 0);

  it("separates thousands the way an English reader reads them", () => {
    // The number from the champion browser's sample column, which rendered `232.204` on a
    // Turkish machine — where an English reader sees two hundred and thirty-two point two.
    expect(formatCount(232_204)).toBe("232,204");
    expect(formatCount(1_000)).toBe("1,000");
  });

  it("leaves a number too small to separate alone", () => {
    expect(formatCount(0)).toBe("0");
    expect(formatCount(999)).toBe("999");
  });

  it("does not depend on the machine's language", () => {
    // The whole defect in one assertion: the same call with the machine's locale is what
    // was there before, and on the machine this was written on it does not match.
    expect(formatCount(232_204)).toBe((232_204).toLocaleString(UI_LOCALE));
  });

  it("prints a date in the interface's own order", () => {
    expect(formatDate(stamp)).toBe("8/26/2026");
  });

  it("passes options through", () => {
    expect(formatDate(stamp, { month: "short", day: "numeric" })).toBe("Aug 26");
  });

  // Most call sites hold an ISO string from an API response and were writing `new Date(iso)`
  // themselves. Taking either saves the wrapper without hiding it.
  it("takes a date, a string or a number", () => {
    expect(formatDate(stamp)).toBe(formatDate(stamp.toISOString()));
    expect(formatDate(stamp)).toBe(formatDate(stamp.getTime()));
  });

  it("prints a date and a time together", () => {
    expect(formatDateTime(stamp)).toBe("8/26/2026, 2:05:00 PM");
  });

  it("prints a time on its own", () => {
    expect(formatTime(stamp, { hour: "numeric", minute: "2-digit" })).toBe("2:05 PM");
  });
});
