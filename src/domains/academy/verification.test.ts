import { describe, expect, it } from "vitest";
import {
  ASSIGNMENT_EXPIRY_DAYS,
  buildEvidence,
  judgeAssignment,
  metricValue,
  type MatchReading,
} from "./verification";

const STARTED = new Date("2026-08-01T00:00:00Z");
const SOON = new Date("2026-08-03T00:00:00Z");
const LATE = new Date("2026-08-20T00:00:00Z");

function readings(...values: number[]): MatchReading[] {
  return values.map((value, i) => ({
    matchId: `m${i}`,
    playedAt: new Date(STARTED.getTime() + (i + 1) * 3_600_000).toISOString(),
    value,
  }));
}

function judge(overrides: Partial<Parameters<typeof judgeAssignment>[0]> = {}) {
  return judgeAssignment({
    direction: "increase",
    target: 6,
    gamesRequired: 3,
    readings: [],
    startedAt: STARTED,
    now: SOON,
    ...overrides,
  });
}

describe("metricValue", () => {
  const row = {
    kills: 4,
    deaths: 2,
    assists: 6,
    csPerMinute: 6.4,
    visionScore: 31,
    teamKills: 20,
  };

  it("reads the straightforward columns", () => {
    expect(metricValue("csPerMinute", row)).toBe(6.4);
    expect(metricValue("visionScore", row)).toBe(31);
    expect(metricValue("deathsPerGame", row)).toBe(2);
  });

  it("computes KDA and kill participation", () => {
    expect(metricValue("kda", row)).toBe(5);
    expect(metricValue("killParticipation", row)).toBe(50);
  });

  it("treats a deathless game as one death rather than dividing by zero", () => {
    expect(metricValue("kda", { ...row, deaths: 0 })).toBe(10);
  });

  it("reads participation in a team that scored nothing as zero", () => {
    expect(metricValue("killParticipation", { ...row, teamKills: 0 })).toBe(0);
  });
});

describe("judgeAssignment", () => {
  it("stays pending while it is still collecting games", () => {
    const result = judge({ readings: readings(7, 7) });

    expect(result.outcome).toBe("pending");
    expect(result.gamesObserved).toBe(2);
    expect(result.average).toBeNull();
  });

  it("passes when the average clears an increase target", () => {
    const result = judge({ readings: readings(5.5, 6.5, 6.5) });

    expect(result.outcome).toBe("passed");
    expect(result.average).toBeCloseTo(6.1667, 3);
    expect(result.counted).toHaveLength(3);
  });

  it("fails when the average falls short", () => {
    expect(judge({ readings: readings(5, 6, 6) }).outcome).toBe("failed");
  });

  // A target the player hit exactly is a target they hit.
  it("counts landing exactly on the target as a pass, in both directions", () => {
    expect(judge({ readings: readings(6, 6, 6) }).outcome).toBe("passed");
    expect(judge({ direction: "decrease", target: 4, readings: readings(4, 4, 4) }).outcome).toBe(
      "passed"
    );
  });

  it("reads a decrease assignment the right way round", () => {
    expect(judge({ direction: "decrease", target: 4, readings: readings(3, 3, 4) }).outcome).toBe(
      "passed"
    );
    expect(judge({ direction: "decrease", target: 4, readings: readings(5, 5, 5) }).outcome).toBe(
      "failed"
    );
  });

  // Taking the first N rather than the best N is what makes it a commitment.
  it("judges the first N games and ignores anything after them", () => {
    const result = judge({ readings: readings(4, 4, 4, 9, 9, 9) });

    expect(result.outcome).toBe("failed");
    expect(result.gamesObserved).toBe(3);
    expect(result.counted.map((r) => r.matchId)).toEqual(["m0", "m1", "m2"]);
  });

  it("expires once the window has passed with too few games", () => {
    const result = judge({ readings: readings(9), now: LATE });

    expect(result.outcome).toBe("expired");
    expect(result.gamesObserved).toBe(1);
    expect(result.average).toBeNull();
  });

  // Games collected inside the window still get judged even if the check runs late.
  it("judges a full set even when the check happens after the window", () => {
    expect(judge({ readings: readings(7, 7, 7), now: LATE }).outcome).toBe("passed");
  });

  it("does not expire on the boundary day itself", () => {
    const boundary = new Date(STARTED.getTime() + ASSIGNMENT_EXPIRY_DAYS * 86_400_000);
    expect(judge({ readings: [], now: boundary }).outcome).toBe("pending");
  });

  it("is pending, not expired, with no games and no time passed", () => {
    expect(judge({ readings: [] }).outcome).toBe("pending");
  });
});

describe("buildEvidence", () => {
  it("records the average and the games that decided it", () => {
    const judgement = judge({ readings: readings(7, 7, 7) });

    expect(buildEvidence(judgement)).toEqual({
      average: 7,
      counted: judgement.counted,
    });
  });

  it("records nothing while the verdict is still open", () => {
    expect(buildEvidence(judge({ readings: readings(7) }))).toBeNull();
  });
});
