import { describe, expect, it } from "vitest";
import { TIME_ZONE_CHOICES, timeZoneLabel } from "@/domains/esports/timeZones";

describe("timeZoneLabel", () => {
  it("names a listed zone by its city and falls back to the IANA name", () => {
    expect(timeZoneLabel("Asia/Seoul")).toBe("Seoul");
    expect(timeZoneLabel("Pacific/Auckland")).toBe("Pacific/Auckland");
    expect(timeZoneLabel(null)).toBe("your zone");
  });
});

describe("TIME_ZONE_CHOICES", () => {
  it("lists only zones this runtime can format in", () => {
    for (const { zone } of TIME_ZONE_CHOICES) {
      expect(() => new Intl.DateTimeFormat("en-US", { timeZone: zone })).not.toThrow();
    }
  });
});
