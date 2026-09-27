import { describe, expect, it } from "vitest";
import {
  MARKER_INSET,
  MIN_SCALE_GOLD,
  goldTicks,
  niceGoldScale,
  objectiveMarkers,
  stackDepth,
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

describe("objectiveMarkers", () => {
  const wide: CurveBox = { left: 0, right: 1000, top: 0, bottom: 100 };

  it("places each objective at the sample it was first seen in", () => {
    const markers = objectiveMarkers(
      timeline([
        { seconds: 240 },
        { seconds: 480, blue: { towers: 1 } },
        { seconds: 960, red: { barons: 1 } },
      ]),
      1000,
      wide
    );

    expect(markers).toEqual([
      expect.objectContaining({ side: "blue", kind: "tower", x: 480, stack: 0, seconds: 480 }),
      expect.objectContaining({ side: "red", kind: "baron", x: 960, stack: 0, seconds: 960 }),
    ]);
  });

  it("stacks objectives sharing a side and a sample on that sample's time", () => {
    const markers = objectiveMarkers(
      timeline([
        { seconds: 240 },
        { seconds: 480, blue: { towers: 2, dragons: 1 }, red: { towers: 1 } },
      ]),
      1000,
      wide
    );

    expect(
      markers.map(({ side, kind, x, stack, count }) => ({ side, kind, x, stack, count }))
    ).toEqual([
      { side: "blue", kind: "tower", x: 480, stack: 0, count: 2 },
      { side: "blue", kind: "dragon", x: 480, stack: 1, count: 1 },
      { side: "red", kind: "tower", x: 480, stack: 0, count: 1 },
    ]);
  });

  it("keeps a marker on the last sample inside the chart", () => {
    const [marker] = objectiveMarkers(
      timeline([{ seconds: 240 }, { seconds: 480, red: { towers: 1 } }]),
      480,
      wide
    );

    expect(marker.x).toBe(1000 - MARKER_INSET);
  });

  it("folds a closing frame that lands on the previous stack into it", () => {
    // 44:10 and 45:05 in a 45:05 game sit 12 units apart on a 592-wide chart.
    const box = { left: 40, right: 632, top: 0, bottom: 100 };
    const markers = objectiveMarkers(
      timeline([
        { seconds: 240 },
        { seconds: 2650, red: { towers: 2, dragons: 1 } },
        { seconds: 2705, red: { towers: 3, dragons: 1 } },
      ]),
      2705,
      box
    );

    expect(new Set(markers.map((marker) => marker.x)).size).toBe(1);
    expect(markers.map((marker) => [marker.kind, marker.stack, marker.seconds])).toEqual([
      ["tower", 0, 2650],
      ["dragon", 1, 2650],
      ["tower", 2, 2705],
    ]);
  });

  it("returns nothing for a game with no objectives", () => {
    expect(objectiveMarkers(timeline([{ seconds: 240 }, { seconds: 480 }]), 480, wide)).toEqual([]);
  });
});

describe("stackDepth", () => {
  it("is the tallest stack on the side, or 0 when it took nothing", () => {
    const markers = objectiveMarkers(
      timeline([
        { seconds: 240, blue: { towers: 1 } },
        { seconds: 480, blue: { towers: 2, inhibitors: 1, barons: 1 } },
      ]),
      480,
      { left: 0, right: 1000, top: 0, bottom: 100 }
    );

    expect(stackDepth(markers, "blue")).toBe(3);
    expect(stackDepth(markers, "red")).toBe(0);
  });
});
