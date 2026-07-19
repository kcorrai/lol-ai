import { describe, it, expect } from "vitest";
import { scoreOtp } from "./otpRecommendationService";

describe("scoreOtp", () => {
  it("ranks more games, higher win rate and higher mastery above lower ones", () => {
    const strong = scoreOtp(50, 34, 80); // 68% WR, high mastery, many games
    const weak = scoreOtp(10, 4, 20); // 40% WR, low mastery, few games
    expect(strong).toBeGreaterThan(weak);
  });

  it("treats unknown mastery as neutral, not zero", () => {
    expect(scoreOtp(20, 12, null)).toBeGreaterThan(0);
    // same games/wins, elite mastery scores higher than unknown
    expect(scoreOtp(20, 12, 90)).toBeGreaterThan(scoreOtp(20, 12, null));
  });

  it("is zero when there are no games", () => {
    expect(scoreOtp(0, 0, 50)).toBe(0);
  });

  it("rewards win rate at equal volume", () => {
    expect(scoreOtp(30, 21, 50)).toBeGreaterThan(scoreOtp(30, 12, 50));
  });
});
