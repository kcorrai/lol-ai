import { describe, it, expect } from "vitest";
import { OVERLAY_FINAL, OVERLAY_LOOP_MS, overlayFrame } from "./overlayDemoTimeline";

describe("overlayFrame", () => {
  it("ends on the numbers the static drawing shows", () => {
    expect(overlayFrame(OVERLAY_LOOP_MS - 1)).toEqual(OVERLAY_FINAL);
  });

  it("only ever counts up within a game", () => {
    let prev = overlayFrame(0);
    for (let t = 90; t < OVERLAY_LOOP_MS; t += 90) {
      const f = overlayFrame(t);
      expect(f.csPerMin).toBeGreaterThanOrEqual(prev.csPerMin);
      expect(f.goldPerMin).toBeGreaterThanOrEqual(prev.goldPerMin);
      expect(f.kills).toBeGreaterThanOrEqual(prev.kills);
      expect(f.assists).toBeGreaterThanOrEqual(prev.assists);
      expect(f.deaths).toBe(prev.deaths);
      prev = f;
    }
  });

  it("changes the scoreboard partway through", () => {
    expect(overlayFrame(0).kills).toBeLessThan(OVERLAY_FINAL.kills);
    expect(overlayFrame(OVERLAY_LOOP_MS / 2).kills).toBeLessThan(OVERLAY_FINAL.kills);
  });

  it("starts a fresh game when the loop comes round", () => {
    expect(overlayFrame(OVERLAY_LOOP_MS)).toEqual(overlayFrame(0));
  });
});
