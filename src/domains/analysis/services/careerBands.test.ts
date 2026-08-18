import { describe, expect, it } from "vitest";
import { buildBands, curateIntoBands, monthKey, monthLabel } from "./careerBands";
import type { CareerEvent, CareerMatchRow } from "./careerTimeline.types";

function row(gameStart: string, won = true, championName = "Ahri"): CareerMatchRow {
  return {
    matchId: `TR1_${gameStart}`,
    championId: 103,
    championName,
    kills: 5,
    deaths: 3,
    assists: 7,
    cs: 180,
    csPerMinute: 6.4,
    visionScore: 22,
    won,
    gameStart: new Date(gameStart),
    gameDuration: 1800,
  };
}

function event(at: string, weight: number, id = at): CareerEvent {
  return {
    id,
    kind: "record",
    group: "records",
    at,
    title: `event ${id}`,
    detail: null,
    tone: "neutral",
    weight,
    href: null,
  };
}

describe("monthKey / monthLabel", () => {
  it("buckets on the UTC month, not the local one", () => {
    expect(monthKey(new Date("2026-08-31T23:30:00Z"))).toBe("2026-08");
    expect(monthKey(new Date("2026-09-01T00:00:00Z"))).toBe("2026-09");
  });

  it("reads back as a month and year", () => {
    expect(monthLabel("2026-08")).toBe("August 2026");
    expect(monthLabel("2025-01")).toBe("January 2025");
  });
});

describe("buildBands", () => {
  it("returns newest month first", () => {
    const bands = buildBands([
      row("2026-06-04T10:00:00Z"),
      row("2026-08-01T10:00:00Z"),
      row("2026-07-11T10:00:00Z"),
    ]);
    expect(bands.map((b) => b.key)).toEqual(["2026-08", "2026-07", "2026-06"]);
  });

  it("counts games and win rate per month", () => {
    const bands = buildBands([
      row("2026-08-01T10:00:00Z", true),
      row("2026-08-02T10:00:00Z", false),
      row("2026-08-03T10:00:00Z", true),
      row("2026-08-04T10:00:00Z", true),
    ]);
    expect(bands[0].games).toBe(4);
    expect(bands[0].wins).toBe(3);
    expect(bands[0].winRate).toBe(75);
  });

  it("has nothing to say about an empty history", () => {
    expect(buildBands([])).toEqual([]);
  });
});

describe("curateIntoBands", () => {
  const bands = buildBands([row("2026-08-01T10:00:00Z")]);

  it("files an event into the month it happened in", () => {
    const { bands: out } = curateIntoBands(bands, [event("2026-08-14T10:00:00Z", 50)]);
    expect(out[0].events).toHaveLength(1);
  });

  it("opens a band for a month with events but no games", () => {
    const { bands: out } = curateIntoBands(bands, [event("2026-05-02T10:00:00Z", 50)]);
    expect(out.map((b) => b.key)).toEqual(["2026-08", "2026-05"]);
    expect(out[1].games).toBe(0);
    expect(out[1].winRate).toBeNull();
  });

  it("keeps the heaviest events when a month overflows", () => {
    const many = [
      event("2026-08-01T10:00:00Z", 10, "light"),
      event("2026-08-02T10:00:00Z", 90, "heavy"),
      event("2026-08-03T10:00:00Z", 50, "middling"),
    ];
    const { bands: out, trimmed } = curateIntoBands(bands, many, 2);

    expect(out[0].events.map((e) => e.id).sort()).toEqual(["heavy", "middling"]);
    expect(trimmed).toBe(1);
  });

  it("puts what it kept back into date order, newest first", () => {
    const many = [
      event("2026-08-01T10:00:00Z", 90, "first"),
      event("2026-08-20T10:00:00Z", 10, "last"),
    ];
    const { bands: out } = curateIntoBands(bands, many, 2);
    expect(out[0].events.map((e) => e.id)).toEqual(["last", "first"]);
  });

  it("drops a month that has neither games nor surviving events", () => {
    const { bands: out } = curateIntoBands([], []);
    expect(out).toEqual([]);
  });

  it("reports nothing trimmed when everything fits", () => {
    const { trimmed } = curateIntoBands(bands, [event("2026-08-14T10:00:00Z", 50)]);
    expect(trimmed).toBe(0);
  });
});
