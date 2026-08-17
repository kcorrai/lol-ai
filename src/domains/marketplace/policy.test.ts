import { describe, it, expect } from "vitest";
import {
  splitPrice,
  respondByFrom,
  autoCompleteFrom,
  reviewRevealDeadlineFrom,
  canCancelFreely,
  isScheduled,
  DEFAULT_COMMISSION_BPS,
  COACH_RESPONSE_HOURS,
  DISPUTE_WINDOW_HOURS,
  REVIEW_BLIND_DAYS,
} from "@/domains/marketplace/policy";

describe("splitPrice", () => {
  it("takes the configured cut", () => {
    expect(splitPrice(10_000, DEFAULT_COMMISSION_BPS)).toEqual({
      platformFeeCents: 2000,
      coachEarningsCents: 8000,
    });
  });

  it("always adds back to exactly the price, even when the cut does not divide evenly", () => {
    // 3333 * 20% = 666.6 — the half cent has to land somewhere, and it must not vanish.
    const split = splitPrice(3333, 2000);
    expect(split.platformFeeCents + split.coachEarningsCents).toBe(3333);
    expect(split.platformFeeCents).toBe(667);
    expect(split.coachEarningsCents).toBe(2666);
  });

  it("balances to the cent across a sweep of awkward prices", () => {
    for (let price = 501; price < 3000; price += 7) {
      for (const bps of [0, 333, 1500, 2000, 2500, 10_000]) {
        const { platformFeeCents, coachEarningsCents } = splitPrice(price, bps);
        expect(platformFeeCents + coachEarningsCents).toBe(price);
        expect(platformFeeCents).toBeGreaterThanOrEqual(0);
        expect(coachEarningsCents).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("gives the coach everything at a zero commission", () => {
    expect(splitPrice(4999, 0)).toEqual({ platformFeeCents: 0, coachEarningsCents: 4999 });
  });
});

describe("deadlines", () => {
  const at = new Date("2026-08-17T12:00:00.000Z");

  it("gives the coach the response window to answer", () => {
    expect(respondByFrom(at).toISOString()).toBe("2026-08-19T12:00:00.000Z");
    expect(COACH_RESPONSE_HOURS).toBe(48);
  });

  it("closes the dispute window a fixed time after delivery", () => {
    expect(autoCompleteFrom(at).toISOString()).toBe("2026-08-20T12:00:00.000Z");
    expect(DISPUTE_WINDOW_HOURS).toBe(72);
  });

  it("reveals reviews a fixed number of days after completion", () => {
    expect(reviewRevealDeadlineFrom(at).toISOString()).toBe("2026-08-31T12:00:00.000Z");
    expect(REVIEW_BLIND_DAYS).toBe(14);
  });

  it("does not mutate the date it was given", () => {
    const original = new Date(at);
    respondByFrom(at);
    expect(at.getTime()).toBe(original.getTime());
  });
});

describe("canCancelFreely", () => {
  const now = new Date("2026-08-17T12:00:00.000Z");

  it("allows it outside the window", () => {
    expect(canCancelFreely(new Date("2026-08-19T12:00:00.000Z"), 24, now)).toBe(true);
  });

  it("refuses it inside the window", () => {
    expect(canCancelFreely(new Date("2026-08-17T20:00:00.000Z"), 24, now)).toBe(false);
  });

  it("allows it exactly on the boundary", () => {
    expect(canCancelFreely(new Date("2026-08-18T12:00:00.000Z"), 24, now)).toBe(true);
  });

  it("refuses it once the session has already started", () => {
    expect(canCancelFreely(new Date("2026-08-17T11:00:00.000Z"), 24, now)).toBe(false);
  });

  // An async review has no slot to count back from — it can be pulled until the
  // coach has actually done the work, and that is delivery, not a clock.
  it("always allows it for a session with no start time", () => {
    expect(canCancelFreely(null, 24, now)).toBe(true);
    expect(canCancelFreely(null, 168, now)).toBe(true);
  });
});

describe("isScheduled", () => {
  it("separates the kinds that need a slot from the one that needs a deadline", () => {
    expect(isScheduled("LIVE_SESSION")).toBe(true);
    expect(isScheduled("LIVE_SPECTATE")).toBe(true);
    expect(isScheduled("VOD_REVIEW")).toBe(false);
  });
});
