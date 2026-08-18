import { describe, expect, it } from "vitest";
import { COMPLETION_XP, MASTERY_XP, xpEarnedAt, xpToAward } from "./xp";

describe("xpToAward", () => {
  it("pays for completing a lesson the first time", () => {
    expect(xpToAward(0, "completed")).toBe(COMPLETION_XP);
  });

  it("pays the mastery on top, not instead", () => {
    expect(xpToAward(COMPLETION_XP, "mastered")).toBe(MASTERY_XP);
    expect(xpEarnedAt("mastered")).toBe(COMPLETION_XP + MASTERY_XP);
  });

  it("pays nothing for completing a lesson that has already paid", () => {
    expect(xpToAward(COMPLETION_XP, "completed")).toBe(0);
  });

  // A decayed lesson keeps its XP, so redoing it must not be a way to farm the same lesson.
  it("pays nothing for redoing or re-mastering a decayed lesson", () => {
    const full = COMPLETION_XP + MASTERY_XP;
    expect(xpToAward(full, "completed")).toBe(0);
    expect(xpToAward(full, "mastered")).toBe(0);
  });

  it("never returns a negative amount", () => {
    expect(xpToAward(9_999, "mastered")).toBe(0);
  });
});
