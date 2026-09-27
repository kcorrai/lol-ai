import { describe, it, expect } from "vitest";
import { DEMO_LOOP_MS, DEMO_RIOT_ID, DEMO_STEPS, demoFrame } from "./heroDemoTimeline";

const TYPE_MS = DEMO_RIOT_ID.length * 90;

describe("demoFrame", () => {
  it("types the Riot ID one character at a time", () => {
    expect(demoFrame(0).typed).toBe("K");
    expect(demoFrame(90 * 3).typed).toBe("Kayj");
    expect(demoFrame(TYPE_MS - 1).typed).toBe(DEMO_RIOT_ID);
    expect(demoFrame(0).step).toBeNull();
  });

  it("walks through each analysis step in order", () => {
    DEMO_STEPS.forEach((_, i) => {
      const frame = demoFrame(TYPE_MS + i * 1000 + 500);
      expect(frame.step).toBe(i);
      expect(frame.done).toBe(false);
    });
  });

  it("holds on the verdict, then starts over", () => {
    const verdict = demoFrame(TYPE_MS + DEMO_STEPS.length * 1000 + 10);
    expect(verdict).toEqual({ typed: DEMO_RIOT_ID, step: null, done: true });
    expect(demoFrame(DEMO_LOOP_MS)).toEqual(demoFrame(0));
  });

  it("never returns an empty box", () => {
    for (let t = 0; t < DEMO_LOOP_MS; t += 45) {
      expect(demoFrame(t).typed.length).toBeGreaterThan(0);
    }
  });
});
