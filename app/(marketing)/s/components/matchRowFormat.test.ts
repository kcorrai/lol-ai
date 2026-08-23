import { describe, expect, it } from "vitest";
import { formatDuration, kdaRatioLabel, timeAgo } from "./matchRowFormat";

describe("formatDuration", () => {
  it("prints minutes and zero-padded seconds", () => {
    expect(formatDuration(2_081)).toBe("34:41");
    expect(formatDuration(605)).toBe("10:05");
  });

  it("does not cap the minutes at an hour", () => {
    expect(formatDuration(3_723)).toBe("62:03");
  });

  it("floors a negative duration rather than printing a minus sign", () => {
    expect(formatDuration(-5)).toBe("0:00");
  });
});

describe("timeAgo", () => {
  const now = Date.parse("2026-08-23T12:00:00.000Z");

  it("steps through minutes, hours, days and months", () => {
    expect(timeAgo("2026-08-23T11:58:00.000Z", now)).toBe("2m ago");
    expect(timeAgo("2026-08-23T09:00:00.000Z", now)).toBe("3h ago");
    expect(timeAgo("2026-08-20T12:00:00.000Z", now)).toBe("3d ago");
    expect(timeAgo("2026-05-23T12:00:00.000Z", now)).toBe("3mo ago");
  });

  it("calls anything under a minute 'just now'", () => {
    expect(timeAgo("2026-08-23T11:59:30.000Z", now)).toBe("just now");
  });

  /** Our clock and Riot's do not agree to the second; a negative age must not leak out. */
  it("does not print a future match as a negative age", () => {
    expect(timeAgo("2026-08-23T12:00:30.000Z", now)).toBe("just now");
  });

  it("gives up on an unparseable timestamp", () => {
    expect(timeAgo("not-a-date", now)).toBe("—");
  });
});

describe("kdaRatioLabel", () => {
  it("rounds to two decimals", () => {
    expect(kdaRatioLabel(9, 2, 11)).toBe("10.00");
    expect(kdaRatioLabel(3, 7, 4)).toBe("1.00");
  });

  it("calls a deathless game perfect rather than dividing by zero", () => {
    expect(kdaRatioLabel(5, 0, 3)).toBe("Perfect");
  });
});
