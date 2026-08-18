import { describe, expect, it } from "vitest";
import { DECAY_CHECK_DAYS, isDecayDue, judgeDecay } from "./decay";
import type { MatchReading } from "./verification";

const NOW = new Date("2026-08-18T00:00:00Z");

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * 86_400_000);
}

function readings(...values: number[]): MatchReading[] {
  return values.map((value, i) => ({
    matchId: `m${i}`,
    playedAt: daysAgo(i).toISOString(),
    value,
  }));
}

describe("isDecayDue", () => {
  it("waits the whole window after mastery", () => {
    expect(isDecayDue(daysAgo(DECAY_CHECK_DAYS - 1), null, NOW)).toBe(false);
    expect(isDecayDue(daysAgo(DECAY_CHECK_DAYS), null, NOW)).toBe(true);
  });

  // Without this the nightly job re-measures every mastered lesson every night.
  it("counts from the last check once there has been one", () => {
    const mastered = daysAgo(200);
    expect(isDecayDue(mastered, daysAgo(2), NOW)).toBe(false);
    expect(isDecayDue(mastered, daysAgo(DECAY_CHECK_DAYS + 1), NOW)).toBe(true);
  });
});

describe("judgeDecay", () => {
  const base = { direction: "increase" as const, target: 7, gamesRequired: 3 };

  it("holds a habit the player is still keeping", () => {
    expect(judgeDecay({ ...base, readings: readings(7.4, 7.1, 8.0) })).toBe("holding");
  });

  it("decays one the numbers have gone back on", () => {
    expect(judgeDecay({ ...base, readings: readings(5.1, 6.0, 6.4) })).toBe("decayed");
  });

  it("judges a decrease target in the other direction", () => {
    const lower = { direction: "decrease" as const, target: 4, gamesRequired: 3 };
    expect(judgeDecay({ ...lower, readings: readings(3, 4, 3) })).toBe("holding");
    expect(judgeDecay({ ...lower, readings: readings(6, 5, 7) })).toBe("decayed");
  });

  // Silence is not regression — a player who has not queued that role is left alone.
  it("returns unmeasured rather than decayed when there are too few games", () => {
    expect(judgeDecay({ ...base, readings: readings(2.0, 1.4) })).toBe("unmeasured");
    expect(judgeDecay({ ...base, readings: [] })).toBe("unmeasured");
  });

  it("judges the most recent games only, however many are passed in", () => {
    // Newest first: the three that count are all above target, the older ones are not.
    expect(judgeDecay({ ...base, readings: readings(9, 9, 9, 1, 1, 1) })).toBe("holding");
  });
});
