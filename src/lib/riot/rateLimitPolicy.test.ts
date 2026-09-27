import { describe, it, expect } from "vitest";
import { configuredWindows, parseRateLimitHeader, rateLimitScope } from "./rateLimitPolicy";

describe("parseRateLimitHeader", () => {
  it("reads Riot's count:seconds pairs, keeps a tenth in reserve, shortest window first", () => {
    expect(parseRateLimitHeader("100:120,20:1")).toEqual([
      { limit: 18, windowMs: 1_000 },
      { limit: 90, windowMs: 120_000 },
    ]);
  });

  it("reads a production key's limits the same way", () => {
    expect(parseRateLimitHeader("500:10,30000:600")).toEqual([
      { limit: 450, windowMs: 10_000 },
      { limit: 27_000, windowMs: 600_000 },
    ]);
  });

  it("never rounds a tiny limit down to zero", () => {
    expect(parseRateLimitHeader("1:1")).toEqual([{ limit: 1, windowMs: 1_000 }]);
  });

  it("rejects anything malformed as a whole rather than trusting half of it", () => {
    expect(parseRateLimitHeader("20:1,abc")).toEqual([]);
    expect(parseRateLimitHeader("0:1")).toEqual([]);
    expect(parseRateLimitHeader("")).toEqual([]);
    expect(parseRateLimitHeader(null)).toEqual([]);
  });
});

describe("configuredWindows", () => {
  it("falls back to a personal key's limits when nothing usable is configured", () => {
    expect(configuredWindows(undefined)).toEqual(parseRateLimitHeader("20:1,100:120"));
    expect(configuredWindows("nonsense")).toEqual(parseRateLimitHeader("20:1,100:120"));
  });

  it("uses what is configured", () => {
    expect(configuredWindows("500:10")).toEqual([{ limit: 450, windowMs: 10_000 }]);
  });
});

describe("rateLimitScope", () => {
  it("scopes by host, because each Riot routing value is its own budget", () => {
    expect(rateLimitScope("https://euw1.api.riotgames.com/lol/summoner/v4/x")).toBe(
      "euw1.api.riotgames.com"
    );
    expect(rateLimitScope("https://europe.api.riotgames.com/lol/match/v5/y")).toBe(
      "europe.api.riotgames.com"
    );
  });

  it("does not throw on something that is not a URL", () => {
    expect(rateLimitScope("not a url")).toBe("unknown");
  });
});
