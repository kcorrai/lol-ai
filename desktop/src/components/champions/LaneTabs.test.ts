import { describe, expect, it } from "vitest";
import { LANES } from "@/lib/champions";
import { laneFor } from "./LaneTabs";

/**
 * The row is a `role="tablist"`, which to a keyboard means one Tab stop and the arrows
 * moving inside it. Five tabs that each took a Tab press put four presses between the
 * sidebar and the list under them.
 */
describe("laneFor", () => {
  it("moves along the row", () => {
    expect(laneFor("ArrowRight", "TOP")).toBe("JUNGLE");
    expect(laneFor("ArrowLeft", "JUNGLE")).toBe("TOP");
  });

  /** Wrapping is what the pattern asks for, and what a row of five short tabs makes obvious. */
  it("wraps at both ends rather than stopping", () => {
    expect(laneFor("ArrowRight", LANES[LANES.length - 1])).toBe(LANES[0]);
    expect(laneFor("ArrowLeft", LANES[0])).toBe(LANES[LANES.length - 1]);
  });

  it("jumps to either end", () => {
    expect(laneFor("Home", "MIDDLE")).toBe(LANES[0]);
    expect(laneFor("End", "MIDDLE")).toBe(LANES[LANES.length - 1]);
  });

  /** Everything else belongs to whatever else was listening for it. */
  it("answers nothing for a key this row does not own", () => {
    for (const key of ["ArrowUp", "ArrowDown", "Tab", "Enter", " ", "a"]) {
      expect(laneFor(key, "MIDDLE")).toBeNull();
    }
  });
});
