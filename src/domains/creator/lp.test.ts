import { describe, it, expect } from "vitest";
import {
  absoluteLp,
  formatLpDelta,
  formatRank,
  isApex,
  lpDelta,
  progressToward,
} from "@/domains/creator/lp";

describe("absoluteLp", () => {
  it("starts the ladder at Iron IV 0 LP", () => {
    expect(absoluteLp({ tier: "IRON", division: "IV", lp: 0 })).toBe(0);
  });

  it("adds 100 per division and 400 per tier", () => {
    expect(absoluteLp({ tier: "IRON", division: "III", lp: 0 })).toBe(100);
    expect(absoluteLp({ tier: "BRONZE", division: "IV", lp: 0 })).toBe(400);
    expect(absoluteLp({ tier: "SILVER", division: "IV", lp: 0 })).toBe(800);
  });

  it("counts LP within a division", () => {
    // Gold is the fourth tier, so its floor is 3 tiers * 4 divisions * 100 LP.
    expect(absoluteLp({ tier: "GOLD", division: "II", lp: 45 })).toBe(1200 + 200 + 45);
  });

  // The reason apex is special-cased at all.
  it("continues Master's LP straight on from Diamond I", () => {
    const diamondOneFull = absoluteLp({ tier: "DIAMOND", division: "I", lp: 100 });
    const masterZero = absoluteLp({ tier: "MASTER", division: "I", lp: 0 });
    expect(masterZero).toBe(diamondOneFull);
  });

  it("puts Master, Grandmaster and Challenger on one LP pool", () => {
    const at = (tier: "MASTER" | "GRANDMASTER" | "CHALLENGER"): number =>
      absoluteLp({ tier, division: "I", lp: 500 });

    expect(at("GRANDMASTER")).toBe(at("MASTER"));
    expect(at("CHALLENGER")).toBe(at("MASTER"));
  });

  it("ignores the division Riot reports for apex tiers", () => {
    expect(absoluteLp({ tier: "CHALLENGER", division: "IV", lp: 900 })).toBe(
      absoluteLp({ tier: "CHALLENGER", division: "I", lp: 900 })
    );
  });

  it("floors negative LP rather than reporting a rank below Iron IV", () => {
    expect(absoluteLp({ tier: "IRON", division: "IV", lp: -20 })).toBe(0);
  });
});

describe("lpDelta", () => {
  it("reports a gain inside one division", () => {
    expect(
      lpDelta(
        { tier: "EMERALD", division: "II", lp: 20 },
        { tier: "EMERALD", division: "II", lp: 84 }
      )
    ).toBe(64);
  });

  it("reports a gain across a promotion as the LP it actually took", () => {
    expect(
      lpDelta(
        { tier: "GOLD", division: "II", lp: 80 },
        { tier: "GOLD", division: "I", lp: 15 }
      )
    ).toBe(35);
  });

  it("reports a loss as negative", () => {
    expect(
      lpDelta(
        { tier: "PLATINUM", division: "III", lp: 40 },
        { tier: "PLATINUM", division: "IV", lp: 78 }
      )
    ).toBe(-62);
  });

  // The bug this whole module exists to avoid: crossing a cutoff is not a gain.
  it("reports nothing gained when Master becomes Grandmaster at the same LP", () => {
    expect(
      lpDelta(
        { tier: "MASTER", division: "I", lp: 500 },
        { tier: "GRANDMASTER", division: "I", lp: 500 }
      )
    ).toBe(0);
  });
});

describe("formatLpDelta", () => {
  it("signs a gain so a viewer can read it at a glance", () => {
    expect(formatLpDelta(64)).toBe("+64");
  });

  it("leaves the minus sign on a loss", () => {
    expect(formatLpDelta(-21)).toBe("-21");
  });

  it("does not sign zero", () => {
    expect(formatLpDelta(0)).toBe("0");
  });
});

describe("formatRank", () => {
  it("title-cases the tier and keeps the division", () => {
    expect(formatRank("EMERALD", "II")).toBe("Emerald II");
  });

  it("drops the division for apex tiers, which have none", () => {
    expect(formatRank("MASTER", "I")).toBe("Master");
    expect(formatRank("GRANDMASTER", "IV")).toBe("Grandmaster");
    expect(formatRank("CHALLENGER", "I")).toBe("Challenger");
  });
});

describe("isApex", () => {
  it("is true only for the three divisionless tiers", () => {
    expect(isApex("MASTER")).toBe(true);
    expect(isApex("GRANDMASTER")).toBe(true);
    expect(isApex("CHALLENGER")).toBe(true);
    expect(isApex("DIAMOND")).toBe(false);
    expect(isApex("IRON")).toBe(false);
  });
});

describe("progressToward", () => {
  const from = { tier: "GOLD", division: "IV", lp: 0 } as const;
  const goal = { tier: "PLATINUM", division: "IV", lp: 0 } as const;

  it("is zero at the starting rank", () => {
    expect(progressToward(from, goal, from)).toBe(0);
  });

  it("is a half at the midpoint", () => {
    expect(progressToward({ tier: "GOLD", division: "II", lp: 0 }, goal, from)).toBe(0.5);
  });

  it("clamps to complete once the goal is passed", () => {
    expect(progressToward({ tier: "DIAMOND", division: "I", lp: 0 }, goal, from)).toBe(1);
  });

  it("clamps to zero below the starting rank rather than going negative", () => {
    expect(progressToward({ tier: "SILVER", division: "I", lp: 0 }, goal, from)).toBe(0);
  });

  // A creator who sets a goal they already hold should see a finished bar, not a
  // division by zero.
  it("reads as complete when the goal is at or below the start", () => {
    expect(progressToward(from, from, from)).toBe(1);
    expect(progressToward(from, { tier: "SILVER", division: "I", lp: 0 }, from)).toBe(1);
  });
});
