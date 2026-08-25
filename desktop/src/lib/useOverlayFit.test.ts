import { describe, expect, it } from "vitest";
import { shouldResize } from "./useOverlayFit";

/**
 * The hook itself needs a DOM and a `ResizeObserver`, and this suite runs in node — which
 * is why the rule it turns on is a function rather than a branch inside the effect, the
 * same shape as `parseCollapsed` and `pairingStateFor`.
 *
 * What is being protected is a window over a running game. Every `true` here is an
 * operating-system resize, so the question is not "did the number change" but "is the
 * change worth moving the window for".
 */
describe("shouldResize", () => {
  it("reports the first real measurement", () => {
    expect(shouldResize(null, 430)).toBe(true);
  });

  it("reports a panel appearing or filling in", () => {
    // The build arriving mid-game is the change this exists for.
    expect(shouldResize(430, 1010)).toBe(true);
    expect(shouldResize(1010, 430)).toBe(true);
  });

  // A `ResizeObserver` fires on sub-pixel changes — a font settling, a number gaining a
  // digit. Moving the window for those would walk it during a match for nothing visible.
  it("ignores a change too small to see", () => {
    expect(shouldResize(430, 430)).toBe(false);
    expect(shouldResize(430, 430.4)).toBe(false);
    expect(shouldResize(430, 429.6)).toBe(false);
  });

  it("reports a change of two pixels or more", () => {
    expect(shouldResize(430, 432)).toBe(true);
    expect(shouldResize(430, 428)).toBe(true);
  });

  // A measurement taken before React has mounted anything. Sending it would ask the core
  // for a window with no height, and the floor there would answer with a sliver.
  it("does not report an unmounted document", () => {
    expect(shouldResize(null, 0)).toBe(false);
    expect(shouldResize(1010, 0)).toBe(false);
  });
});
