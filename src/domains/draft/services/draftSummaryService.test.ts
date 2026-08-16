import { describe, expect, it } from "vitest";
import { makeDraftChampion } from "@/test/draftFixtures";
import { toDraftTeam } from "./draftSummaryService";

const ORNN = makeDraftChampion("Ornn", "Ornn", { lanes: ["TOP"] });
const AHRI = makeDraftChampion("Ahri", "Ahri", { lanes: ["MIDDLE"] });
const JINX = makeDraftChampion("Jinx", "Jinx", { lanes: ["BOTTOM"] });
const LEONA = makeDraftChampion("Leona", "Leona", { lanes: ["UTILITY"] });
const VI = makeDraftChampion("Vi", "Vi", { lanes: ["JUNGLE"] });
const SECOND_JUNGLER = makeDraftChampion("Nidalee", "Nidalee", { lanes: ["JUNGLE"] });

describe("toDraftTeam", () => {
  it("keys a normal comp by the lane each champion plays", () => {
    expect(toDraftTeam([ORNN, VI, AHRI, JINX, LEONA])).toEqual({
      TOP: "Ornn",
      JUNGLE: "Vi",
      MIDDLE: "Ahri",
      BOTTOM: "Jinx",
      UTILITY: "Leona",
    });
  });

  it("still places a champion whose only lane is taken", () => {
    // Two junglers is a real draft, and the verdict must score all five picks
    // rather than quietly dropping the one that lost the lane.
    const team = toDraftTeam([ORNN, VI, SECOND_JUNGLER, JINX, LEONA]);
    expect(Object.values(team)).toHaveLength(5);
    expect(Object.values(team)).toContain("Nidalee");
  });

  it("drops nothing but places nobody twice", () => {
    const team = toDraftTeam([VI, SECOND_JUNGLER]);
    expect(Object.values(team).sort()).toEqual(["Nidalee", "Vi"]);
  });
});
