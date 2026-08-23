import { describe, it, expect } from "vitest";
import { completeSkillOrder, TOTAL_CHAMPION_LEVELS } from "./skillOrder";

// Yasuo mid, as op.gg actually returns it: Q and E maxed, W left at 3 points, two R points taken.
const YASUO_15 = ["Q", "E", "W", "Q", "Q", "R", "Q", "E", "Q", "E", "R", "E", "E", "W", "W"];

describe("completeSkillOrder", () => {
  it("extends op.gg's 15 levels to a full 18", () => {
    expect(completeSkillOrder(YASUO_15, ["Q", "E", "W"])).toHaveLength(TOTAL_CHAMPION_LEVELS);
  });

  it("puts the last ultimate point at level 16 and the leftover basics after it", () => {
    // Yasuo has 2 W points left, so 16/17/18 can only be R, W, W.
    expect(completeSkillOrder(YASUO_15, ["Q", "E", "W"]).slice(15)).toEqual(["R", "W", "W"]);
  });

  it("never exceeds a champion's real point budget", () => {
    const counts = completeSkillOrder(YASUO_15, ["Q", "E", "W"]).reduce<Record<string, number>>(
      (acc, a) => ({ ...acc, [a]: (acc[a] ?? 0) + 1 }),
      {}
    );
    expect(counts).toEqual({ Q: 5, W: 5, E: 5, R: 3 });
  });

  it("orders the leftover basics by the champion's max priority", () => {
    // Two points left, one W and one E: max order decides which lands on 17.
    const order = ["Q", "W", "E", "Q", "Q", "R", "Q", "W", "Q", "W", "R", "W", "E", "E", "E"];
    expect(completeSkillOrder(order, ["Q", "W", "E"]).slice(15)).toEqual(["R", "W", "E"]);
    expect(completeSkillOrder(order, ["Q", "E", "W"]).slice(15)).toEqual(["R", "E", "W"]);
  });

  it("is idempotent, so a build completed once can be passed through again", () => {
    const once = completeSkillOrder(YASUO_15, ["Q", "E", "W"]);
    expect(completeSkillOrder(once, ["Q", "E", "W"])).toEqual(once);
  });

  it("leaves an empty order empty rather than inventing a build", () => {
    expect(completeSkillOrder([], ["Q", "W", "E"])).toEqual([]);
  });

  it("still completes when no max order is available", () => {
    expect(completeSkillOrder(YASUO_15)).toHaveLength(TOTAL_CHAMPION_LEVELS);
  });
});
