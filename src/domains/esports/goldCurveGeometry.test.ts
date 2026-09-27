import { describe, expect, it } from "vitest";
import {
  MARKER_GAP,
  MIN_SCALE_GOLD,
  goldTicks,
  niceGoldScale,
  objectiveMarkers,
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
      960,
      wide
    );

    expect(markers).toEqual([
      expect.objectContaining({ side: "blue", kind: "tower", count: 1, x: 500, seconds: 480 }),
      expect.objectContaining({ side: "red", kind: "baron", count: 1, x: 990, seconds: 960 }),
    ]);
  });

  it("fans out objectives that share a side and a sample", () => {
    const markers = objectiveMarkers(
      timeline([{ seconds: 240 }, { seconds: 480, blue: { towers: 2, dragons: 1 } }]),
      960,
      wide
    );

    expect(markers.map((marker) => marker.x)).toEqual([500 - MARKER_GAP / 2, 500 + MARKER_GAP / 2]);
    expect(markers[0]).toMatchObject({ kind: "tower", count: 2 });
  });

  it("pulls a fan at the edge inside the chart as a whole", () => {
    const markers = objectiveMarkers(
      timeline([{ seconds: 240 }, { seconds: 480, red: { towers: 1, inhibitors: 1 } }]),
      480,
      wide
    );

    expect(markers.map((marker) => marker.x)).toEqual([
      1000 - MARKER_GAP * 1.5,
      1000 - MARKER_GAP / 2,
    ]);
  });

  it("returns nothing for a game with no objectives", () => {
    expect(objectiveMarkers(timeline([{ seconds: 240 }, { seconds: 480 }]), 480, wide)).toEqual([]);
  });
});

describe("objectiveMarkers spreading", () => {
  const wide: CurveBox = { left: 0, right: 1000, top: 0, bottom: 100 };

  it("pushes a neighbouring sample's marker clear of a crowded one", () => {
    // Samples 20 units apart: the first sample's pair fans to 490/510, so the
    // next sample's marker at 520 has to move to 530.
    const markers = objectiveMarkers(
      timeline([
        { seconds: 240 },
        { seconds: 500, blue: { towers: 1, dragons: 1 } },
        { seconds: 520, blue: { towers: 2, dragons: 1 } },
        { seconds: 1000 },
      ]),
      1000,
      wide
    );

    expect(markers.map((marker) => marker.x)).toEqual([490, 510, 530]);
  });

  it("never lets two markers in a row overlap", () => {
    const markers = objectiveMarkers(
      timeline([
        { seconds: 240 },
        { seconds: 900, red: { towers: 2, inhibitors: 1 } },
        { seconds: 960, red: { towers: 3, inhibitors: 2, barons: 1 } },
        { seconds: 1000, red: { towers: 4, inhibitors: 2, barons: 1, dragons: 1 } },
      ]),
      1000,
      wide
    );

    const xs = markers.map((marker) => marker.x);
    xs.slice(1).forEach((x, i) => expect(x - xs[i]).toBeGreaterThanOrEqual(MARKER_GAP));
    expect(xs[xs.length - 1]).toBeLessThanOrEqual(1000 - MARKER_GAP / 2);
  });
});
