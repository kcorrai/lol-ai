import { describe, expect, it } from "vitest";
import { makeDraftChampion } from "@/test/draftFixtures";
import type { CounterTables, ScoreParts, TeamProfile } from "./advice.types";
import {
  banTotal,
  compScore,
  counterScore,
  metaScore,
  pickTotal,
  priorityScore,
} from "./draftAdviceScoring";

const NO_PROFILE: TeamProfile = {
  adShare: 0,
  apShare: 0,
  frontlineScore: 0,
  engageScore: 0,
  missingLanes: ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"],
  avgWinRate: 0,
};

function profile(overrides: Partial<TeamProfile>): TeamProfile {
  return { ...NO_PROFILE, adShare: 50, apShare: 50, ...overrides };
}

describe("metaScore", () => {
  it("is the champion's win rate above 50", () => {
    expect(metaScore(makeDraftChampion("a", "A", { winRate: 53.4 }))).toBe(3.4);
    expect(metaScore(makeDraftChampion("a", "A", { winRate: 47 }))).toBe(-3);
  });

  it("is zero when the meta feed has no entry", () => {
    expect(metaScore(makeDraftChampion("a", "A", { winRate: 0 }))).toBe(0);
  });
});

describe("counterScore", () => {
  const tables: CounterTables = {
    zed: { lane: "MIDDLE", vs: { ahri: 45, orianna: 56 } },
    darius: { lane: "TOP", vs: { ahri: 52 } },
  };

  it("mirrors the opponent's table — beating them scores positive", () => {
    // Zed wins 45% into Ahri, so Ahri is 5 points up, halved for matchup noise.
    expect(counterScore(makeDraftChampion("Ahri", "Ahri"), ["Zed"], tables)).toBe(2.5);
    expect(counterScore(makeDraftChampion("Orianna", "Orianna"), ["Zed"], tables)).toBe(-3);
  });

  it("averages across every enemy on the board", () => {
    // +5 into Zed and -2 into Darius → mean +1.5, halved.
    expect(counterScore(makeDraftChampion("Ahri", "Ahri"), ["Zed", "Darius"], tables)).toBe(0.8);
  });

  it("skips enemies with no matchup entry rather than calling them even", () => {
    const withGap: CounterTables = { ...tables, ekko: { lane: "MIDDLE", vs: {} } };
    expect(counterScore(makeDraftChampion("Ahri", "Ahri"), ["Zed", "Ekko"], withGap)).toBe(2.5);
  });

  it("is zero with nothing to compare against", () => {
    expect(counterScore(makeDraftChampion("Ahri", "Ahri"), [], tables)).toBe(0);
    expect(counterScore(makeDraftChampion("Ahri", "Ahri"), ["Nobody"], tables)).toBe(0);
  });

  it("matches case-insensitively", () => {
    expect(counterScore(makeDraftChampion("AHRI", "Ahri"), ["zed"], tables)).toBe(2.5);
  });
});

describe("compScore", () => {
  const mage = makeDraftChampion("Ahri", "Ahri", { attack: 3, magic: 8, tags: ["Mage"] });
  const adc = makeDraftChampion("Jinx", "Jinx", { attack: 9, magic: 2, tags: ["Marksman"] });
  const tank = makeDraftChampion("Ornn", "Ornn", { attack: 5, magic: 3, tags: ["Tank"] });
  const fighter = makeDraftChampion("Sett", "Sett", { attack: 8, magic: 2, tags: ["Fighter"] });

  it("rewards the damage type a skewed comp is missing", () => {
    expect(compScore(mage, profile({ adShare: 80, apShare: 20 }))).toBe(1.5);
    expect(compScore(adc, profile({ adShare: 80, apShare: 20 }))).toBe(0);
    expect(compScore(adc, profile({ adShare: 20, apShare: 80 }))).toBe(1.5);
  });

  it("ignores a balanced comp", () => {
    expect(compScore(mage, profile({ adShare: 55, apShare: 45, frontlineScore: 55 }))).toBe(0);
  });

  it("rewards a frontline when there is none, tanks more than fighters", () => {
    expect(compScore(tank, profile({ frontlineScore: 0 }))).toBe(1.5);
    // Half a tank's bonus, rounded to the one decimal every score carries.
    expect(compScore(fighter, profile({ frontlineScore: 0 }))).toBe(0.8);
    expect(compScore(tank, profile({ frontlineScore: 80 }))).toBe(0);
  });

  it("stacks a damage fix with a frontline fix", () => {
    expect(compScore(tank, profile({ adShare: 20, apShare: 80, frontlineScore: 0 }))).toBe(3);
  });

  it("says nothing about an empty comp", () => {
    expect(compScore(mage, NO_PROFILE)).toBe(0);
  });
});

describe("totals", () => {
  const parts: ScoreParts = { meta: 2, counter: 1.5, comp: 1.5, priority: 3 };

  it("adds strength, matchup and comp fit for a pick", () => {
    expect(pickTotal(parts)).toBe(5);
  });

  it("adds strength, contest and threat for a ban", () => {
    // A ban ignores comp fit — the champion is never joining your team.
    expect(banTotal(parts)).toBe(6.5);
  });

  it("scales ban priority off the ban rate", () => {
    expect(priorityScore(makeDraftChampion("a", "A", { banRate: 42 }))).toBe(4.2);
    expect(priorityScore(makeDraftChampion("a", "A", { banRate: 0 }))).toBe(0);
  });
});
