import { describe, expect, it } from "vitest";
import { parseCollapsed } from "./useSidebarCollapsed";

/**
 * The hook itself needs a DOM and this suite runs in node, which is why the rule it turns
 * on is a function rather than a branch inside the effect.
 */
describe("parseCollapsed", () => {
  it("collapses a machine that has never been asked", () => {
    expect(parseCollapsed(null)).toBe(true);
  });

  it("honours a player who widened it", () => {
    expect(parseCollapsed("false")).toBe(false);
  });

  it("honours a player who narrowed it again", () => {
    expect(parseCollapsed("true")).toBe(true);
  });

  it("falls back to collapsed for anything it did not write", () => {
    // An older build's value, or a hand. Neither is worth honouring, and the width the
    // window was designed at is the safer of the two answers.
    for (const raw of ["", "0", "no", "FALSE", "{}"]) {
      expect(parseCollapsed(raw)).toBe(true);
    }
  });
});
