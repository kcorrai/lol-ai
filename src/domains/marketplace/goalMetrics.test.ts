import { describe, expect, it } from "vitest";
import { metGoal, metricValue, validTarget } from "@/domains/marketplace/goalMetrics";
import type { GameLine } from "@/domains/marketplace/goalMetrics";

const GAME: GameLine = {
  kills: 4,
  deaths: 2,
  assists: 6,
  csPerMinute: 7.4,
  visionScore: 30,
  durationSeconds: 1800,
};

describe("metricValue", () => {
  it("reads each metric off one game", () => {
    expect(metricValue("CS_PER_MIN", GAME)).toBe(7.4);
    expect(metricValue("DEATHS", GAME)).toBe(2);
    expect(metricValue("VISION_PER_MIN", GAME)).toBe(1);
    expect(metricValue("KDA", GAME)).toBe(5);
  });

  it("treats a deathless game's KDA as kills plus assists", () => {
    expect(metricValue("KDA", { ...GAME, deaths: 0 })).toBe(10);
  });

  it("does not divide by a zero-length game", () => {
    expect(metricValue("VISION_PER_MIN", { ...GAME, durationSeconds: 0 })).toBe(0);
  });
});

describe("metGoal", () => {
  it("needs at least the target for the rising metrics", () => {
    expect(metGoal("CS_PER_MIN", 7, GAME)).toBe(true);
    expect(metGoal("CS_PER_MIN", 8, GAME)).toBe(false);
  });

  it("needs at most the target for deaths", () => {
    expect(metGoal("DEATHS", 3, GAME)).toBe(true);
    expect(metGoal("DEATHS", 1, GAME)).toBe(false);
  });
});

describe("validTarget", () => {
  it("keeps targets inside each metric's range", () => {
    expect(validTarget("CS_PER_MIN", 7)).toBe(true);
    expect(validTarget("CS_PER_MIN", 40)).toBe(false);
    expect(validTarget("DEATHS", 0)).toBe(true);
    expect(validTarget("KDA", Number.NaN)).toBe(false);
  });
});
