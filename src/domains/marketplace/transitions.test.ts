import { describe, it, expect } from "vitest";
import type { BookingStatus } from "@prisma/client";
import {
  canTransition,
  isTerminal,
  nextStatuses,
  holdsFunds,
  refundsAutomatically,
  isReviewable,
} from "@/domains/marketplace/transitions";

const ALL: BookingStatus[] = [
  "PENDING_COACH",
  "CONFIRMED",
  "DECLINED",
  "EXPIRED",
  "CANCELLED_BY_STUDENT",
  "CANCELLED_BY_COACH",
  "DELIVERED",
  "COMPLETED",
  "DISPUTED",
  "REFUNDED",
];

describe("canTransition", () => {
  it("walks the happy path", () => {
    expect(canTransition("PENDING_COACH", "CONFIRMED")).toBe(true);
    expect(canTransition("CONFIRMED", "DELIVERED")).toBe(true);
    expect(canTransition("DELIVERED", "COMPLETED")).toBe(true);
  });

  it("walks the dispute path", () => {
    expect(canTransition("DELIVERED", "DISPUTED")).toBe(true);
    expect(canTransition("DISPUTED", "REFUNDED")).toBe(true);
    expect(canTransition("DISPUTED", "COMPLETED")).toBe(true);
  });

  it("refuses to skip the coach's acceptance", () => {
    expect(canTransition("PENDING_COACH", "DELIVERED")).toBe(false);
    expect(canTransition("PENDING_COACH", "COMPLETED")).toBe(false);
  });

  it("refuses to complete a session that was never delivered", () => {
    expect(canTransition("CONFIRMED", "COMPLETED")).toBe(false);
  });

  it("refuses to dispute a session before it was delivered", () => {
    expect(canTransition("CONFIRMED", "DISPUTED")).toBe(false);
    expect(canTransition("PENDING_COACH", "DISPUTED")).toBe(false);
  });

  it("refuses to cancel a request the coach already declined", () => {
    expect(canTransition("DECLINED", "CANCELLED_BY_STUDENT")).toBe(false);
  });

  it("refuses to reopen a refunded booking", () => {
    expect(canTransition("REFUNDED", "COMPLETED")).toBe(false);
    expect(canTransition("REFUNDED", "DISPUTED")).toBe(false);
  });

  it("lets nothing leave a terminal status", () => {
    for (const from of ALL.filter(isTerminal)) {
      for (const to of ALL) {
        expect(canTransition(from, to)).toBe(false);
      }
    }
  });

  it("never lets a status transition to itself", () => {
    for (const status of ALL) {
      expect(canTransition(status, status)).toBe(false);
    }
  });

  it("covers every status, so a new one cannot be added without a decision", () => {
    for (const status of ALL) {
      expect(nextStatuses(status)).toBeDefined();
    }
  });

  it("only ever points at real statuses", () => {
    for (const status of ALL) {
      for (const next of nextStatuses(status)) {
        expect(ALL).toContain(next);
      }
    }
  });

  it("leaves every status reachable from the start", () => {
    const seen = new Set<BookingStatus>(["PENDING_COACH"]);
    const queue: BookingStatus[] = ["PENDING_COACH"];
    while (queue.length > 0) {
      for (const next of nextStatuses(queue.shift() as BookingStatus)) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect([...seen].sort()).toEqual([...ALL].sort());
  });
});

describe("holdsFunds", () => {
  it("holds from the request until it settles", () => {
    expect(holdsFunds("PENDING_COACH")).toBe(true);
    expect(holdsFunds("CONFIRMED")).toBe(true);
    expect(holdsFunds("DELIVERED")).toBe(true);
    expect(holdsFunds("DISPUTED")).toBe(true);
  });

  it("holds nothing once it has settled either way", () => {
    expect(holdsFunds("COMPLETED")).toBe(false);
    expect(holdsFunds("REFUNDED")).toBe(false);
    expect(holdsFunds("DECLINED")).toBe(false);
    expect(holdsFunds("EXPIRED")).toBe(false);
  });

  // The invariant the ledger rests on: money is either held, or the booking is
  // finished. There is no third state where it is neither.
  it("holds funds for exactly the non-terminal statuses", () => {
    for (const status of ALL) {
      expect(holdsFunds(status)).toBe(!isTerminal(status));
    }
  });
});

describe("refundsAutomatically", () => {
  it("refunds without a judgement call when the session never happened", () => {
    expect(refundsAutomatically("DECLINED")).toBe(true);
    expect(refundsAutomatically("EXPIRED")).toBe(true);
    expect(refundsAutomatically("CANCELLED_BY_COACH")).toBe(true);
    expect(refundsAutomatically("CANCELLED_BY_STUDENT")).toBe(true);
  });

  it("does not decide a dispute by itself", () => {
    expect(refundsAutomatically("DISPUTED")).toBe(false);
    expect(refundsAutomatically("COMPLETED")).toBe(false);
  });
});

describe("isReviewable", () => {
  it("only opens reviews on a session that completed", () => {
    for (const status of ALL) {
      expect(isReviewable(status)).toBe(status === "COMPLETED");
    }
  });
});
