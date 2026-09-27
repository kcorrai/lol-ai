import { describe, expect, it } from "vitest";
import { fromSegment, toolFilterRoute } from "./toolFilterRoutes";

const route = (path: string, query = "") => toolFilterRoute(path, new URLSearchParams(query));

describe("toolFilterRoute", () => {
  it("rewrites a filtered role tier list onto its cacheable path", () => {
    expect(route("/tools/tier-list/top", "tier=emerald_plus&region=EUW1")).toEqual({
      kind: "rewrite",
      pathname: "/tools/tier-list/top/f/emerald_plus/euw1",
    });
    expect(route("/tools/tier-list/mid", "region=kr")).toEqual({
      kind: "rewrite",
      pathname: "/tools/tier-list/mid/f/any/kr",
    });
  });

  it("rewrites a filtered counters page, keeping the role canonical", () => {
    expect(route("/counters/Jhin", "role=adc&tier=diamond_plus")).toEqual({
      kind: "rewrite",
      pathname: "/counters/Jhin/f/diamond_plus/BOTTOM",
    });
  });

  it("leaves unfiltered pages, and filters it does not recognise, to the static page", () => {
    expect(route("/tools/tier-list/top")).toBeNull();
    expect(route("/counters/Jhin")).toBeNull();
    // A made-up value must not mint a new cached page.
    expect(route("/counters/Jhin", "tier=bronze_plus_plus")).toBeNull();
    expect(route("/tools/tier-list/top", "region=mars")).toBeNull();
  });

  it("redirects the hub's legacy ?role= onto the role page", () => {
    expect(route("/tools/tier-list", "role=support")).toEqual({
      kind: "redirect",
      pathname: "/tools/tier-list/support",
    });
    expect(route("/tools/tier-list")).toBeNull();
  });

  it("refuses the internal paths when asked for them directly", () => {
    expect(route("/counters/Jhin/f/garbage/garbage")).toEqual({ kind: "not-found" });
    expect(route("/tools/tier-list/top/f/x/y")).toEqual({ kind: "not-found" });
  });

  it("leaves the rest of the tools alone", () => {
    expect(route("/counters/Jhin/opengraph-image-abc")).toBeNull();
    expect(route("/tools/counter-picker", "tier=emerald_plus")).toBeNull();
  });
});

describe("fromSegment", () => {
  it("reads the placeholder as not set", () => {
    expect(fromSegment("any")).toBeUndefined();
    expect(fromSegment("emerald_plus")).toBe("emerald_plus");
  });
});
