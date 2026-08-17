import { describe, it, expect } from "vitest";
import {
  compareRanks,
  higherRank,
  isApex,
  rankScore,
  tiersAtOrAbove,
  formatRank,
} from "@/domains/marketplace/rank";

describe("compareRanks", () => {
  it("puts a higher tier above a lower one whatever the division", () => {
    expect(
      compareRanks({ tier: "SILVER", division: "IV" }, { tier: "BRONZE", division: "I" })
    ).toBeGreaterThan(0);
  });

  // Divisions read backwards: IV is the bottom of a tier and I is the top.
  it("orders divisions from IV up to I", () => {
    expect(
      compareRanks({ tier: "GOLD", division: "I" }, { tier: "GOLD", division: "IV" })
    ).toBeGreaterThan(0);
    expect(
      compareRanks({ tier: "GOLD", division: "III" }, { tier: "GOLD", division: "II" })
    ).toBeLessThan(0);
  });

  it("breaks a tie on LP", () => {
    expect(
      compareRanks(
        { tier: "GOLD", division: "II", leaguePoints: 75 },
        { tier: "GOLD", division: "II", leaguePoints: 12 }
      )
    ).toBeGreaterThan(0);
  });

  it("treats identical ranks as equal", () => {
    expect(
      compareRanks(
        { tier: "PLATINUM", division: "III", leaguePoints: 40 },
        { tier: "PLATINUM", division: "III", leaguePoints: 40 }
      )
    ).toBe(0);
  });

  // Riot reports division I for every apex player, so comparing on it would say
  // two Challengers are equal when one has 1200 LP and the other has 200.
  it("ignores division inside the apex tiers and separates them by LP", () => {
    const low = { tier: "CHALLENGER" as const, division: "I" as const, leaguePoints: 200 };
    const high = { tier: "CHALLENGER" as const, division: "I" as const, leaguePoints: 1200 };
    expect(compareRanks(high, low)).toBeGreaterThan(0);
  });

  it("does not let LP push a rank past the next division", () => {
    const goldTwoMaxLp = { tier: "GOLD" as const, division: "II" as const, leaguePoints: 99 };
    const goldOneNoLp = { tier: "GOLD" as const, division: "I" as const, leaguePoints: 0 };
    expect(compareRanks(goldOneNoLp, goldTwoMaxLp)).toBeGreaterThan(0);
  });

  it("does not let an absurd LP value push a rank past the next tier", () => {
    const inflated = { tier: "GOLD" as const, division: "I" as const, leaguePoints: 999_999 };
    const platinum = { tier: "PLATINUM" as const, division: "IV" as const, leaguePoints: 0 };
    expect(compareRanks(platinum, inflated)).toBeGreaterThan(0);
  });

  it("orders the whole ladder monotonically", () => {
    const ladder = [
      { tier: "IRON" as const, division: "IV" as const },
      { tier: "IRON" as const, division: "I" as const },
      { tier: "BRONZE" as const, division: "IV" as const },
      { tier: "EMERALD" as const, division: "II" as const },
      { tier: "DIAMOND" as const, division: "IV" as const },
      { tier: "MASTER" as const, division: "I" as const },
      { tier: "GRANDMASTER" as const, division: "I" as const },
      { tier: "CHALLENGER" as const, division: "I" as const },
    ];
    const scores = ladder.map(rankScore);
    expect(scores).toEqual([...scores].sort((a, b) => a - b));
  });
});

describe("higherRank", () => {
  it("keeps the incumbent when the new rank is not strictly higher", () => {
    const peak = { tier: "DIAMOND" as const, division: "II" as const };
    expect(higherRank(peak, { tier: "DIAMOND", division: "II" })).toBe(peak);
    expect(higherRank(peak, { tier: "PLATINUM", division: "I" })).toBe(peak);
  });

  it("takes the new rank when it is higher", () => {
    const climbed = { tier: "MASTER" as const, division: "I" as const };
    expect(higherRank({ tier: "DIAMOND", division: "I" }, climbed)).toBe(climbed);
  });
});

describe("isApex and tiersAtOrAbove", () => {
  it("knows which tiers have no divisions", () => {
    expect(isApex("MASTER")).toBe(true);
    expect(isApex("GRANDMASTER")).toBe(true);
    expect(isApex("CHALLENGER")).toBe(true);
    expect(isApex("DIAMOND")).toBe(false);
  });

  it("lists a filter's tiers from the floor upward", () => {
    expect(tiersAtOrAbove("DIAMOND")).toEqual([
      "DIAMOND",
      "MASTER",
      "GRANDMASTER",
      "CHALLENGER",
    ]);
    expect(tiersAtOrAbove("IRON")).toHaveLength(10);
    expect(tiersAtOrAbove("CHALLENGER")).toEqual(["CHALLENGER"]);
  });
});

describe("formatRank", () => {
  it("writes a divisioned rank the way the game does", () => {
    expect(formatRank({ tier: "GOLD", division: "II" })).toBe("Gold II");
  });

  it("writes an apex rank with LP instead of a division", () => {
    expect(formatRank({ tier: "CHALLENGER", division: "I", leaguePoints: 1204 })).toBe(
      "Challenger 1204 LP"
    );
    expect(formatRank({ tier: "MASTER", division: "I" })).toBe("Master 0 LP");
  });
});
