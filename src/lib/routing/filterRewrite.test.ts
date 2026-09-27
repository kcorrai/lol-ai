import { describe, expect, it } from "vitest";
import { fromSegment, toSegment } from "./filterRewrite";

describe("filter segments", () => {
  it("reads the placeholder as not set", () => {
    expect(fromSegment("any")).toBeUndefined();
    expect(fromSegment("emerald_plus")).toBe("emerald_plus");
  });

  it("round-trips a value with spaces and punctuation", () => {
    expect(fromSegment(toSegment("LCK Challengers League"))).toBe("LCK Challengers League");
    expect(toSegment(null)).toBe("any");
  });

  it("does not throw on a malformed escape", () => {
    expect(fromSegment("%E0%A4%A")).toBe("%E0%A4%A");
  });
});
