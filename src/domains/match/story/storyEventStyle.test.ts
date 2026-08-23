import { describe, expect, it } from "vitest";
import {
  STORY_EVENT_STYLE,
  STORY_KIND_ORDER,
  fadeAt,
  riftPercent,
} from "@/domains/match/story/storyEventStyle";
import { STORY_EVENT_KINDS } from "@/domains/match/types/matchStory.types";

describe("STORY_KIND_ORDER", () => {
  it("offers every narrated kind as a chip, exactly once", () => {
    expect([...STORY_KIND_ORDER].sort()).toEqual([...STORY_EVENT_KINDS].sort());
  });

  it("gives no two kinds the same shape, so colour is never the only difference", () => {
    const shapes = STORY_KIND_ORDER.map((kind) => STORY_EVENT_STYLE[kind].shape);
    expect(new Set(shapes).size).toBe(shapes.length);
  });
});

describe("riftPercent", () => {
  it("flips the y axis — Riot counts north, the map counts down the screen", () => {
    // Blue's base is the bottom-left corner of both spaces, so a low-x, low-y Riot position has to
    // come out low-x and *high*-y in the map's box.
    const blueBase = riftPercent({ x: 800, y: 800 });
    expect(blueBase.x).toBeLessThan(10);
    expect(blueBase.y).toBeGreaterThan(90);

    const redBase = riftPercent({ x: 14_000, y: 14_000 });
    expect(redBase.x).toBeGreaterThan(90);
    expect(redBase.y).toBeLessThan(10);
  });

  it("puts the middle of the Rift in the middle of the box", () => {
    const mid = riftPercent({ x: 7435, y: 7435 });
    expect(mid.x).toBeCloseTo(50, 1);
    expect(mid.y).toBeCloseTo(50, 1);
  });

  it("clamps a position outside the published bounds onto the edge", () => {
    // The exact Rift bound is not published and moves between map versions, so an event can land
    // just outside it. It belongs on the edge of the picture, not off it.
    expect(riftPercent({ x: -500, y: 20_000 })).toEqual({ x: 2, y: 2 });
    expect(riftPercent({ x: 20_000, y: -500 })).toEqual({ x: 98, y: 98 });
  });
});

describe("fadeAt", () => {
  it("is full strength on the minute it happened", () => {
    expect(fadeAt(12, 12)).toBe(1);
  });

  it("fades over the minutes after, without ever reaching zero", () => {
    expect(fadeAt(12, 15)).toBeCloseTo(0.5, 5);
    expect(fadeAt(12, 40)).toBe(0.15);
  });

  it("does not over-brighten an event the playhead has not reached", () => {
    expect(fadeAt(20, 12)).toBe(1);
  });
});
