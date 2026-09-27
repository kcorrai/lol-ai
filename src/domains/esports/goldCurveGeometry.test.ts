import { describe, expect, it } from "vitest";
import {
  MIN_SCALE_GOLD,
  goldTicks,
  niceGoldScale,
  goldToY,
  plotGoldCurve,
  timeToX,
  type CurveBox,
} from "@/domains/esports/goldCurveGeometry";
import type { GameTimeline, TimelineTeamState } from "@/domains/esports/types";

const BOX: CurveBox = { left: 10, right: 110, top: 0, bottom: 100 };

function state(over: Partial<TimelineTeamState> = {}): TimelineTeamState {
  return { gold: 0, kills: 0, towers: 0, inhibitors: 0, barons: 0, dragons: 0, ...over };
}

function timeline(
  samples: {
    seconds: number;
    blue?: Partial<TimelineTeamState>;
    red?: Partial<TimelineTeamState>;
  }[]
): GameTimeline {
  return {
    gameId: "g1",
    startedAt: "2026-08-13T18:42:04Z",
    intervalSeconds: 240,
    truncated: false,
    durationSeconds: samples[samples.length - 1]?.seconds ?? null,
    samples: samples.map((sample) => ({
      seconds: sample.seconds,
      blue: state(sample.blue),
      red: state(sample.red),
    })),
  };
}

describe("timeToX", () => {
  it("runs from the box's left edge to its right edge", () => {
    expect(timeToX(0, 600, BOX)).toBe(10);
    expect(timeToX(300, 600, BOX)).toBe(60);
    expect(timeToX(600, 600, BOX)).toBe(110);
  });
});

describe("goldToY", () => {
  it("puts a level game on the middle line", () => {
    expect(goldToY(0, 4000, BOX)).toBe(50);
  });

  it("puts blue's lead above the middle and red's below", () => {
    expect(goldToY(4000, 4000, BOX)).toBe(0);
    expect(goldToY(-4000, 4000, BOX)).toBe(100);
    expect(goldToY(2000, 4000, BOX)).toBe(25);
  });
});

describe("plotGoldCurve", () => {
  it("scales to the largest lead either side held, rounded to a thousand", () => {
    const { scale, span, points } = plotGoldCurve(
      timeline([
        { seconds: 240, blue: { gold: 5000 }, red: { gold: 4000 } },
        { seconds: 480, blue: { gold: 9000 }, red: { gold: 12800 } },
      ]),
      BOX
    );

    expect(scale).toBe(4000);
    expect(span).toBe(480);
    expect(points.map((point) => point.diff)).toEqual([1000, -3800]);
    expect(points[1]).toMatchObject({ x: 110, y: 97.5 });
  });

  it("never scales below the floor, so a level game stays flat", () => {
    const { scale } = plotGoldCurve(
      timeline([
        { seconds: 240, blue: { gold: 5000 }, red: { gold: 4900 } },
        { seconds: 480, blue: { gold: 9000 }, red: { gold: 9200 } },
      ]),
      BOX
    );

    expect(scale).toBe(MIN_SCALE_GOLD);
  });
});

describe("niceGoldScale", () => {
  it("rounds the largest lead up to a whole thousand", () => {
    expect(niceGoldScale(7340)).toBe(8000);
    expect(niceGoldScale(4000)).toBe(4000);
  });

  it("keeps the floor for a close game", () => {
    expect(niceGoldScale(300)).toBe(MIN_SCALE_GOLD);
  });
});

describe("goldTicks", () => {
  it("labels both extremes, both halves and level, blue positive", () => {
    expect(goldTicks(3000).map((tick) => tick.label)).toEqual([
      "+3k",
      "+1.5k",
      "0",
      "−1.5k",
      "−3k",
    ]);
  });
});
