import { describe, expect, it } from "vitest";
import {
  DEFAULT_DRAWING,
  MIN_OPACITY,
  parseDrawing,
  parseOpacity,
  withPanel,
} from "./overlaySettings";

/**
 * The hooks need a DOM and this suite runs in node, which is why the rules they turn on are
 * functions rather than branches inside an effect.
 */
describe("parseDrawing", () => {
  it("gives a machine that has never been asked the three panels it has always had", () => {
    expect(parseDrawing(null)).toEqual(DEFAULT_DRAWING);
  });

  it("honours a player who turned one off", () => {
    const stored = JSON.stringify({ panels: ["performance", "build"], opacity: 1 });
    expect(parseDrawing(stored).panels).toEqual(["performance", "build"]);
  });

  it("lets a player turn every panel off", () => {
    // Not folded back to the default: an empty overlay is a thing somebody can mean, and it
    // is one shortcut away from being full again.
    expect(parseDrawing(JSON.stringify({ panels: [] })).panels).toEqual([]);
  });

  /** A file written by a later build, read by this one. */
  it("drops a panel this build does not have", () => {
    const stored = JSON.stringify({ panels: ["performance", "objectives"] });
    expect(parseDrawing(stored).panels).toEqual(["performance"]);
  });

  it("draws the panels in its own order, not the order they were stored in", () => {
    const stored = JSON.stringify({ panels: ["build", "performance"] });
    expect(parseDrawing(stored).panels).toEqual(["performance", "build"]);
  });

  it("falls back rather than throwing on anything it did not write", () => {
    for (const raw of ["", "not json", "[]", "null", "42", '{"panels":"all"}']) {
      expect(parseDrawing(raw).panels).toEqual(DEFAULT_DRAWING.panels);
    }
  });
});

describe("parseOpacity", () => {
  it("keeps a value in range", () => {
    expect(parseOpacity(0.6)).toBe(0.6);
  });

  /** Clamped rather than refused — the honest answer to 0 is the dimmest that still shows. */
  it("clamps a value that would make the overlay unreadable", () => {
    expect(parseOpacity(0)).toBe(MIN_OPACITY);
    expect(parseOpacity(-3)).toBe(MIN_OPACITY);
    expect(parseOpacity(4)).toBe(1);
  });

  it("falls back for anything that is not a number", () => {
    for (const value of [undefined, null, "0.5", Number.NaN, Infinity]) {
      expect(parseOpacity(value)).toBe(DEFAULT_DRAWING.opacity);
    }
  });
});

describe("withPanel", () => {
  it("turns one off without disturbing the others", () => {
    expect(withPanel(DEFAULT_DRAWING, "matchup", false).panels).toEqual(["performance", "build"]);
  });

  it("turns one back on in its own place rather than at the end", () => {
    const without = withPanel(DEFAULT_DRAWING, "performance", false);
    expect(withPanel(without, "performance", true).panels).toEqual(DEFAULT_DRAWING.panels);
  });

  it("turning on a panel that is already on changes nothing", () => {
    expect(withPanel(DEFAULT_DRAWING, "build", true).panels).toEqual(DEFAULT_DRAWING.panels);
  });

  it("leaves the opacity alone", () => {
    const dim = { ...DEFAULT_DRAWING, opacity: 0.5 };
    expect(withPanel(dim, "build", false).opacity).toBe(0.5);
  });
});
