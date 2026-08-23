import { describe, expect, it } from "vitest";
import { goldDiff, objectiveEvents, peakLead, sampleClock } from "@/domains/esports/timeline";
import type { GameTimeline, TimelineTeamState } from "@/domains/esports/types";

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

describe("goldDiff", () => {
  it("reads positive when blue is ahead", () => {
    const [sample] = timeline([
      { seconds: 240, blue: { gold: 9000 }, red: { gold: 7500 } },
    ]).samples;
    expect(goldDiff(sample)).toBe(1500);
  });

  it("reads negative when red is ahead", () => {
    const [sample] = timeline([
      { seconds: 240, blue: { gold: 7500 }, red: { gold: 9000 } },
    ]).samples;
    expect(goldDiff(sample)).toBe(-1500);
  });
});

describe("objectiveEvents", () => {
  it("reports what each side gained between samples", () => {
    const events = objectiveEvents(
      timeline([
        { seconds: 240, blue: {}, red: {} },
        { seconds: 480, blue: { towers: 1 }, red: { dragons: 1 } },
        { seconds: 720, blue: { towers: 3 }, red: { dragons: 1, barons: 1 } },
      ])
    );

    expect(events).toEqual([
      { seconds: 480, side: "blue", kind: "tower", count: 1, total: 1 },
      { seconds: 480, side: "red", kind: "dragon", count: 1, total: 1 },
      { seconds: 720, side: "blue", kind: "tower", count: 2, total: 3 },
      { seconds: 720, side: "red", kind: "baron", count: 1, total: 1 },
    ]);
  });

  it("counts what the first sample already contains", () => {
    // The walk's first sample is four minutes in, so anything taken before it
    // belongs to that window rather than going unreported.
    const events = objectiveEvents(timeline([{ seconds: 240, red: { dragons: 1 } }]));

    expect(events).toEqual([{ seconds: 240, side: "red", kind: "dragon", count: 1, total: 1 }]);
  });

  it("ignores a count that goes backwards", () => {
    // Counts only rise during a game. A fall is the feed contradicting itself,
    // not a team un-taking a baron.
    const events = objectiveEvents(
      timeline([
        { seconds: 240, blue: { towers: 3 } },
        { seconds: 480, blue: { towers: 1 } },
      ])
    );

    expect(events).toEqual([{ seconds: 240, side: "blue", kind: "tower", count: 3, total: 3 }]);
  });

  it("has nothing to report for a game with no objectives yet", () => {
    expect(objectiveEvents(timeline([{ seconds: 240 }]))).toEqual([]);
  });
});

describe("peakLead", () => {
  it("finds the largest lead either side was sampled holding", () => {
    expect(
      peakLead(
        timeline([
          { seconds: 240, blue: { gold: 9000 }, red: { gold: 8000 } },
          { seconds: 480, blue: { gold: 14000 }, red: { gold: 20000 } },
          { seconds: 720, blue: { gold: 25000 }, red: { gold: 27000 } },
        ])
      )
    ).toEqual({ side: "red", gold: 6000, seconds: 480 });
  });

  it("keeps the first sample of a lead that is matched but not beaten later", () => {
    expect(
      peakLead(
        timeline([
          { seconds: 240, blue: { gold: 5000 }, red: { gold: 3000 } },
          { seconds: 480, blue: { gold: 9000 }, red: { gold: 7000 } },
        ])
      )
    ).toEqual({ side: "blue", gold: 2000, seconds: 240 });
  });

  it("has no answer for a game that was level at every sample", () => {
    expect(
      peakLead(timeline([{ seconds: 240, blue: { gold: 5000 }, red: { gold: 5000 } }]))
    ).toBeNull();
  });
});

describe("sampleClock", () => {
  it("reads as minutes and padded seconds", () => {
    expect(sampleClock(720)).toBe("12:00");
    expect(sampleClock(725)).toBe("12:05");
  });
});
