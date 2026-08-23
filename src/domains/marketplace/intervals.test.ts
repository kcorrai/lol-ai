import { describe, it, expect } from "vitest";
import { merge, subtractAll, subtractOne } from "@/domains/marketplace/intervals";
import type { Interval } from "@/domains/marketplace/intervals";

const iv = (start: string, end: string): Interval => ({
  start: new Date(start),
  end: new Date(end),
});

describe("merge", () => {
  it("joins overlapping and touching intervals", () => {
    expect(
      merge([
        iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z"),
        iv("2026-08-17T10:30:00Z", "2026-08-17T12:00:00Z"),
        iv("2026-08-17T12:00:00Z", "2026-08-17T13:00:00Z"),
      ])
    ).toEqual([iv("2026-08-17T10:00:00Z", "2026-08-17T13:00:00Z")]);
  });

  it("leaves a gap alone", () => {
    const input = [
      iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z"),
      iv("2026-08-17T12:00:00Z", "2026-08-17T13:00:00Z"),
    ];
    expect(merge(input)).toHaveLength(2);
  });

  it("does not mutate its input", () => {
    const input = [iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z")];
    merge([...input, iv("2026-08-17T10:30:00Z", "2026-08-17T12:00:00Z")]);
    expect(input[0].end.toISOString()).toBe("2026-08-17T11:00:00.000Z");
  });
});

describe("subtractAll", () => {
  it("splits a window a booking sits inside", () => {
    const result = subtractAll(
      [iv("2026-08-17T10:00:00Z", "2026-08-17T14:00:00Z")],
      [iv("2026-08-17T11:00:00Z", "2026-08-17T12:00:00Z")]
    );
    expect(result).toEqual([
      iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z"),
      iv("2026-08-17T12:00:00Z", "2026-08-17T14:00:00Z"),
    ]);
  });

  it("removes a window a booking covers completely", () => {
    expect(
      subtractAll(
        [iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z")],
        [iv("2026-08-17T09:00:00Z", "2026-08-17T12:00:00Z")]
      )
    ).toEqual([]);
  });

  it("ignores a booking that does not touch the window", () => {
    const window = [iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z")];
    expect(subtractAll(window, [iv("2026-08-17T11:00:00Z", "2026-08-17T12:00:00Z")])).toEqual(
      window
    );
  });

  it("applies every booking, not just the first", () => {
    expect(
      subtractAll(
        [iv("2026-08-17T10:00:00Z", "2026-08-17T16:00:00Z")],
        [
          iv("2026-08-17T11:00:00Z", "2026-08-17T12:00:00Z"),
          iv("2026-08-17T14:00:00Z", "2026-08-17T15:00:00Z"),
        ]
      )
    ).toEqual([
      iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z"),
      iv("2026-08-17T12:00:00Z", "2026-08-17T14:00:00Z"),
      iv("2026-08-17T15:00:00Z", "2026-08-17T16:00:00Z"),
    ]);
  });
});

describe("subtractOne", () => {
  it("returns the window untouched when the block does not reach it", () => {
    const window = iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z");
    expect(subtractOne(window, iv("2026-08-17T08:00:00Z", "2026-08-17T09:00:00Z"))).toEqual([
      window,
    ]);
  });

  // Half-open ranges: a block that ends exactly where the window starts does
  // not overlap it, or every back-to-back session would eat the next one.
  it("treats a block that only touches the edge as no overlap", () => {
    const window = iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z");
    expect(subtractOne(window, iv("2026-08-17T09:00:00Z", "2026-08-17T10:00:00Z"))).toEqual([
      window,
    ]);
    expect(subtractOne(window, iv("2026-08-17T11:00:00Z", "2026-08-17T12:00:00Z"))).toEqual([
      window,
    ]);
  });

  it("trims from the front and from the back", () => {
    const window = iv("2026-08-17T10:00:00Z", "2026-08-17T12:00:00Z");
    expect(subtractOne(window, iv("2026-08-17T09:00:00Z", "2026-08-17T11:00:00Z"))).toEqual([
      iv("2026-08-17T11:00:00Z", "2026-08-17T12:00:00Z"),
    ]);
    expect(subtractOne(window, iv("2026-08-17T11:00:00Z", "2026-08-17T13:00:00Z"))).toEqual([
      iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z"),
    ]);
  });

  it("returns nothing when the block swallows the window whole", () => {
    expect(
      subtractOne(
        iv("2026-08-17T10:00:00Z", "2026-08-17T11:00:00Z"),
        iv("2026-08-17T09:00:00Z", "2026-08-17T12:00:00Z")
      )
    ).toEqual([]);
  });
});
