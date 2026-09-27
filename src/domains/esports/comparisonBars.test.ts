import { describe, expect, it } from "vitest";
import { comparisonBars } from "@/domains/esports/comparisonBars";

describe("comparisonBars", () => {
  it("scales both bars against the longer figure", () => {
    expect(comparisonBars({ pro: 10, you: 8, gapPercent: -20 }, false)).toMatchObject({
      proShare: 1,
      youShare: 0.8,
      gapLabel: "−20%",
      tone: "behind",
    });
  });

  it("takes the player's side when they are ahead", () => {
    expect(comparisonBars({ pro: 8, you: 10, gapPercent: 25 }, false)).toMatchObject({
      proShare: 0.8,
      youShare: 1,
      gapLabel: "+25%",
      tone: "ahead",
    });
  });

  it("stays level inside the meaningful gap and on a thin sample", () => {
    expect(comparisonBars({ pro: 10, you: 9.8, gapPercent: -2 }, false).tone).toBe("level");
    expect(comparisonBars({ pro: 10, you: 5, gapPercent: -50 }, true).tone).toBe("level");
  });

  it("has no percentage against a pro figure of zero", () => {
    expect(comparisonBars({ pro: 0, you: 3, gapPercent: null }, false)).toMatchObject({
      proShare: 0,
      youShare: 1,
      gapLabel: null,
      tone: "level",
    });
  });
});
