import { describe, it, expect } from "vitest";
import {
  computeKDA,
  computeDamageShare,
  computeKillParticipation,
  computeConsistency,
  detectDeathCluster,
  detectNotableEvents,
  identifyStrongestArea,
  identifyWeakestArea,
} from "./performanceCalculator";

describe("computeKDA", () => {
  it("calculates correctly with deaths", () => {
    expect(computeKDA(5, 2, 7)).toBe(6.0);
  });

  it("uses 1 as denominator when deaths are 0 (no divide-by-zero)", () => {
    expect(computeKDA(5, 0, 3)).toBe(8.0);
  });

  it("returns 0 when kills and assists are both 0", () => {
    expect(computeKDA(0, 5, 0)).toBe(0.0);
  });
});

describe("computeDamageShare", () => {
  it("calculates share correctly", () => {
    expect(computeDamageShare(5000, 20000)).toBe(0.25);
  });

  it("returns 0 when team damage is 0", () => {
    expect(computeDamageShare(1000, 0)).toBe(0);
  });
});

describe("computeKillParticipation", () => {
  it("calculates correctly", () => {
    expect(computeKillParticipation(3, 7, 20)).toBe(0.5);
  });

  it("returns 0 when team kills are 0", () => {
    expect(computeKillParticipation(0, 0, 0)).toBe(0);
  });
});

describe("computeConsistency", () => {
  it("returns high when values are very close", () => {
    expect(computeConsistency([6.0, 6.1, 5.9, 6.05])).toBe("high");
  });

  it("returns low when values vary a lot", () => {
    expect(computeConsistency([2.0, 9.0, 3.0, 10.0])).toBe("low");
  });

  it("returns medium for a single value array", () => {
    expect(computeConsistency([5.0])).toBe("medium");
  });

  it("returns high when mean is 0", () => {
    expect(computeConsistency([0, 0, 0])).toBe("high");
  });
});

describe("detectDeathCluster", () => {
  it("detects early game deaths (short timers)", () => {
    expect(detectDeathCluster(20, 2)).toBe("early_game"); // 10s per death
  });

  it("detects mid game deaths", () => {
    expect(detectDeathCluster(50, 2)).toBe("mid_game"); // 25s per death
  });

  it("detects late game deaths (long timers)", () => {
    expect(detectDeathCluster(80, 2)).toBe("late_game"); // 40s per death
  });

  it("returns spread when deaths are less than 1", () => {
    expect(detectDeathCluster(30, 0)).toBe("spread");
  });
});

describe("detectNotableEvents", () => {
  it("flags first blood", () => {
    const events = detectNotableEvents(2, 1, 5.0, 20, true, "MIDDLE", true, 10);
    expect(events).toContain("Secured first blood");
  });

  it("flags perfect KDA", () => {
    const events = detectNotableEvents(5, 0, 5.0, 20, false, "MIDDLE", true, 10);
    expect(events).toContain("Perfect KDA (0 deaths)");
  });

  it("flags high CS", () => {
    const events = detectNotableEvents(2, 1, 9.0, 20, false, "MIDDLE", true, 10);
    expect(events).toContain("Excellent CS: 9/min");
  });

  it("flags low vision for non-support", () => {
    const events = detectNotableEvents(2, 1, 5.0, 5, false, "MIDDLE", true, 10);
    expect(events).toContain("Low vision score: 5");
  });

  it("does not flag low vision for UTILITY", () => {
    const events = detectNotableEvents(0, 1, 1.0, 5, false, "UTILITY", true, 10);
    expect(events).not.toContain("Low vision score: 5");
  });
});

describe("identifyStrongestArea", () => {
  it("returns farming when CS is disproportionately high", () => {
    const area = identifyStrongestArea(2.0, 10.0, 20, 0.15, 45);
    expect(area).toBe("farming (CS)");
  });

  it("returns fighting when KDA is disproportionately high", () => {
    const area = identifyStrongestArea(9.0, 5.0, 20, 0.20, 45);
    expect(area).toBe("fighting (KDA)");
  });
});

describe("identifyWeakestArea", () => {
  it("returns vision control when vision score is very low", () => {
    const area = identifyWeakestArea(3.0, 6.5, 5, 50);
    expect(area).toBe("vision control");
  });

  it("returns fighting when KDA is very low", () => {
    const area = identifyWeakestArea(0.5, 7.0, 25, 50);
    expect(area).toBe("fighting (KDA)");
  });
});
