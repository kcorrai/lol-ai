import { describe, expect, it } from "vitest";
import { makeDraftChampion } from "@/test/draftFixtures";
import { assignLanes, buildTeamProfile, missingLanes } from "./teamProfile";

const ORNN = makeDraftChampion("Ornn", "Ornn", {
  lanes: ["TOP"],
  tags: ["Tank"],
  attack: 5,
  magic: 3,
  winRate: 52,
});
const AHRI = makeDraftChampion("Ahri", "Ahri", {
  lanes: ["MIDDLE"],
  tags: ["Mage"],
  attack: 3,
  magic: 8,
  winRate: 50,
});
const JINX = makeDraftChampion("Jinx", "Jinx", {
  lanes: ["BOTTOM"],
  tags: ["Marksman"],
  attack: 9,
  magic: 2,
  winRate: 48,
});
const FLEX = makeDraftChampion("Sylas", "Sylas", {
  lanes: ["MIDDLE", "TOP"],
  tags: ["Mage", "Assassin"],
  attack: 6,
  magic: 7,
});

describe("assignLanes", () => {
  it("gives each champion its own lane", () => {
    const lanes = assignLanes([ORNN, AHRI, JINX]);
    expect(lanes.get("ornn")).toBe("TOP");
    expect(lanes.get("ahri")).toBe("MIDDLE");
    expect(lanes.get("jinx")).toBe("BOTTOM");
  });

  it("places the least flexible champion first so it is never stranded", () => {
    // Sylas plays mid or top; Ahri only plays mid. Assigning Sylas to mid first
    // would leave Ahri with nowhere to go.
    const lanes = assignLanes([FLEX, AHRI]);
    expect(lanes.get("ahri")).toBe("MIDDLE");
    expect(lanes.get("sylas")).toBe("TOP");
  });

  it("leaves out a champion whose lanes are all taken", () => {
    const lanes = assignLanes([AHRI, makeDraftChampion("Zed", "Zed", { lanes: ["MIDDLE"] })]);
    expect(lanes.size).toBe(1);
  });
});

describe("missingLanes", () => {
  it("is every lane for an empty comp", () => {
    expect(missingLanes([])).toEqual(["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"]);
  });

  it("drops the lanes already filled", () => {
    expect(missingLanes([ORNN, AHRI])).toEqual(["JUNGLE", "BOTTOM", "UTILITY"]);
  });
});

describe("buildTeamProfile", () => {
  it("splits damage by the Data Dragon profile", () => {
    const profile = buildTeamProfile([AHRI, JINX]);
    // attack 3+9 = 12, magic 8+2 = 10, of 22.
    expect(profile.adShare).toBe(55);
    expect(profile.apShare).toBe(45);
  });

  it("scores frontline off tanks and fighters", () => {
    expect(buildTeamProfile([ORNN]).frontlineScore).toBe(40);
    expect(buildTeamProfile([AHRI, JINX]).frontlineScore).toBe(0);
  });

  it("averages win rate, treating a missing entry as even", () => {
    expect(buildTeamProfile([ORNN, AHRI, JINX]).avgWinRate).toBe(50);
    expect(buildTeamProfile([FLEX]).avgWinRate).toBe(50);
  });

  it("returns an empty profile rather than dividing by zero", () => {
    const empty = buildTeamProfile([]);
    expect(empty.adShare).toBe(0);
    expect(empty.apShare).toBe(0);
    expect(empty.avgWinRate).toBe(0);
    expect(empty.missingLanes).toHaveLength(5);
  });
});
