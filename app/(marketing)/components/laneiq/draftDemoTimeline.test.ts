import { describe, it, expect } from "vitest";
import { DRAFT_SEQUENCE } from "@/domains/draft";
import {
  DEMO_DRAFT,
  DEMO_LOCKED_OUT,
  DRAFT_FINAL,
  DRAFT_LOOP_MS,
  DRAFT_STEP_MS,
  TURN_SECONDS,
  draftFrame,
  isFilled,
} from "./draftDemoTimeline";

describe("draftFrame", () => {
  it("opens on blue's first ban with a full clock", () => {
    const frame = draftFrame(0);
    expect(frame.locked).toBe(0);
    expect(frame.current).toMatchObject({ side: "BLUE", kind: "BAN", slot: 0 });
    expect(frame.seconds).toBe(TURN_SECONDS);
  });

  it("follows the room's own order, one step per turn", () => {
    DRAFT_SEQUENCE.forEach((step, i) => {
      expect(draftFrame(i * DRAFT_STEP_MS + 100).current).toEqual(step);
    });
  });

  it("runs the clock down within a turn but never below zero", () => {
    for (let t = 0; t < DRAFT_STEP_MS; t += 30) {
      const s = draftFrame(t).seconds;
      expect(s).toBeLessThanOrEqual(TURN_SECONDS);
      expect(s).toBeGreaterThan(0);
    }
  });

  it("finishes before the Arsenal panel rotates to the next tab", () => {
    // ArsenalTabs advances every 7000ms.
    expect(DRAFT_SEQUENCE.length * DRAFT_STEP_MS).toBeLessThan(7000);
  });

  it("holds the finished draft, then starts again", () => {
    expect(draftFrame(DRAFT_SEQUENCE.length * DRAFT_STEP_MS + 10)).toEqual(DRAFT_FINAL);
    expect(draftFrame(DRAFT_LOOP_MS)).toEqual(draftFrame(0));
  });
});

describe("isFilled", () => {
  it("fills blue's first pick only after the six opening bans", () => {
    expect(isFilled(6, "BLUE", "PICK", 0)).toBe(false);
    expect(isFilled(7, "BLUE", "PICK", 0)).toBe(true);
  });

  it("gives red two picks in a row after blue's first", () => {
    expect(isFilled(9, "RED", "PICK", 1)).toBe(true);
    expect(isFilled(9, "BLUE", "PICK", 1)).toBe(false);
  });
});

describe("DEMO_DRAFT", () => {
  it("never uses a champion twice in one game", () => {
    const all = [
      ...DEMO_DRAFT.BLUE.bans,
      ...DEMO_DRAFT.BLUE.picks,
      ...DEMO_DRAFT.RED.bans,
      ...DEMO_DRAFT.RED.picks,
    ];
    expect(new Set(all).size).toBe(20);
  });

  it("locks out every pick of the two earlier games in fearless game 3", () => {
    expect(DEMO_LOCKED_OUT).toBe(20);
  });
});
