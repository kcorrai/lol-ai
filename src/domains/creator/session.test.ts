import { describe, it, expect } from "vitest";
import {
  isInSession,
  isVisible,
  MAX_DELAY_SECONDS,
  normaliseDelaySeconds,
  resolveSessionWindow,
  startOfLocalDay,
} from "@/domains/creator/session";

describe("startOfLocalDay", () => {
  it("returns midnight UTC for a UTC zone", () => {
    const now = new Date("2026-08-18T14:37:12.500Z");
    expect(startOfLocalDay(now, "UTC").toISOString()).toBe("2026-08-18T00:00:00.000Z");
  });

  // Istanbul is UTC+3 year round, so local midnight is 21:00 the previous day.
  it("returns local midnight for a zone ahead of UTC", () => {
    const now = new Date("2026-08-18T14:37:12.000Z"); // 17:37 in Istanbul
    expect(startOfLocalDay(now, "Europe/Istanbul").toISOString()).toBe(
      "2026-08-17T21:00:00.000Z"
    );
  });

  it("returns local midnight for a zone behind UTC", () => {
    const now = new Date("2026-08-18T14:37:12.000Z"); // 07:37 in Los Angeles (PDT, UTC-7)
    expect(startOfLocalDay(now, "America/Los_Angeles").toISOString()).toBe(
      "2026-08-18T07:00:00.000Z"
    );
  });

  // The interesting case: the UTC date and the local date are different days.
  it("uses the local day, not the UTC one, when they disagree", () => {
    const now = new Date("2026-08-18T01:30:00.000Z"); // 04:30 on the 18th in Istanbul
    expect(startOfLocalDay(now, "Europe/Istanbul").toISOString()).toBe(
      "2026-08-17T21:00:00.000Z"
    );

    const evening = new Date("2026-08-18T23:30:00.000Z"); // 16:30 on the 18th in LA
    expect(startOfLocalDay(evening, "America/Los_Angeles").toISOString()).toBe(
      "2026-08-18T07:00:00.000Z"
    );
  });

  it("falls back to UTC for a zone Intl does not know", () => {
    const now = new Date("2026-08-18T14:37:12.000Z");
    expect(startOfLocalDay(now, "Middle/Earth").toISOString()).toBe("2026-08-18T00:00:00.000Z");
  });
});

describe("normaliseDelaySeconds", () => {
  it("passes a sane delay through", () => {
    expect(normaliseDelaySeconds(90)).toBe(90);
  });

  it("floors a negative delay at zero", () => {
    expect(normaliseDelaySeconds(-30)).toBe(0);
  });

  it("caps an absurd delay", () => {
    expect(normaliseDelaySeconds(99_999)).toBe(MAX_DELAY_SECONDS);
  });

  it("truncates a fractional delay", () => {
    expect(normaliseDelaySeconds(12.9)).toBe(12);
  });

  it("treats a non-finite delay as none", () => {
    expect(normaliseDelaySeconds(Number.NaN)).toBe(0);
  });
});

describe("resolveSessionWindow", () => {
  const now = new Date("2026-08-18T14:00:00.000Z");

  it("pulls visibleUntil back by the broadcast delay", () => {
    const window = resolveSessionWindow({
      sessionStartedAt: new Date("2026-08-18T10:00:00.000Z"),
      timezone: "UTC",
      delaySeconds: 120,
      now,
    });

    expect(window.visibleUntil.toISOString()).toBe("2026-08-18T13:58:00.000Z");
    expect(window.start.toISOString()).toBe("2026-08-18T10:00:00.000Z");
  });

  it("starts the session at local midnight when none was set explicitly", () => {
    const window = resolveSessionWindow({
      sessionStartedAt: null,
      timezone: "Europe/Istanbul",
      delaySeconds: 0,
      now,
    });

    expect(window.start.toISOString()).toBe("2026-08-17T21:00:00.000Z");
  });

  it("prefers an explicit session start over local midnight", () => {
    const window = resolveSessionWindow({
      sessionStartedAt: new Date("2026-08-18T12:30:00.000Z"),
      timezone: "Europe/Istanbul",
      delaySeconds: 0,
      now,
    });

    expect(window.start.toISOString()).toBe("2026-08-18T12:30:00.000Z");
  });

  // Pressing "reset session" mid-stream must not produce a backwards range.
  it("clamps a session started inside the delay window to visibleUntil", () => {
    const window = resolveSessionWindow({
      sessionStartedAt: new Date("2026-08-18T13:59:30.000Z"),
      timezone: "UTC",
      delaySeconds: 120,
      now,
    });

    expect(window.start.getTime()).toBe(window.visibleUntil.getTime());
    expect(window.start.getTime()).toBeLessThanOrEqual(window.visibleUntil.getTime());
  });

  it("clamps the stored delay rather than trusting it", () => {
    const window = resolveSessionWindow({
      sessionStartedAt: null,
      timezone: "UTC",
      delaySeconds: -60,
      now,
    });

    expect(window.visibleUntil.toISOString()).toBe(now.toISOString());
  });
});

describe("isVisible", () => {
  const window = resolveSessionWindow({
    sessionStartedAt: new Date("2026-08-18T10:00:00.000Z"),
    timezone: "UTC",
    delaySeconds: 120,
    now: new Date("2026-08-18T14:00:00.000Z"),
  });

  // The feature the delay exists for, stated as a test.
  it("hides a game that finished more recently than the broadcast delay", () => {
    expect(isVisible(new Date("2026-08-18T13:59:30.000Z"), window)).toBe(false);
  });

  it("shows a game older than the broadcast delay", () => {
    expect(isVisible(new Date("2026-08-18T13:50:00.000Z"), window)).toBe(true);
  });

  it("shows a game exactly at the boundary", () => {
    expect(isVisible(new Date("2026-08-18T13:58:00.000Z"), window)).toBe(true);
  });
});

describe("isInSession", () => {
  const window = resolveSessionWindow({
    sessionStartedAt: new Date("2026-08-18T10:00:00.000Z"),
    timezone: "UTC",
    delaySeconds: 120,
    now: new Date("2026-08-18T14:00:00.000Z"),
  });

  it("counts a game inside the window", () => {
    expect(isInSession(new Date("2026-08-18T11:00:00.000Z"), window)).toBe(true);
  });

  it("excludes a game from before the session started", () => {
    expect(isInSession(new Date("2026-08-18T09:59:59.000Z"), window)).toBe(false);
  });

  it("excludes a game still inside the delay window", () => {
    expect(isInSession(new Date("2026-08-18T13:59:00.000Z"), window)).toBe(false);
  });

  it("counts a game exactly at the session start", () => {
    expect(isInSession(new Date("2026-08-18T10:00:00.000Z"), window)).toBe(true);
  });
});
