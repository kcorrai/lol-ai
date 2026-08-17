import { describe, it, expect } from "vitest";
import { CLASSIC_COLUMNS, compareClassic, isSolvedRow } from "./classicMode";
import type { QuizChampion } from "@/domains/quiz/types/quiz.types";

function champ(overrides: Partial<QuizChampion> = {}): QuizChampion {
  return {
    id: "Test",
    key: 1,
    name: "Test",
    title: "the Test",
    gender: "Male",
    species: ["Human"],
    regions: ["Noxus"],
    positions: ["Top"],
    classes: ["Fighter"],
    resource: "Mana",
    rangeType: "Melee",
    releaseYear: 2015,
    skinNums: [0],
    lore: "",
    abilities: [],
    ...overrides,
  };
}

describe("compareClassic", () => {
  it("marks every column exact when the guess is the answer", () => {
    const answer = champ();
    const row = compareClassic(answer, answer);
    for (const col of CLASSIC_COLUMNS) expect(row[col.key].match, col.key).toBe("exact");
    expect(isSolvedRow(row)).toBe(true);
  });

  it("marks a single-valued column red when it disagrees", () => {
    const row = compareClassic(champ({ gender: "Female" }), champ({ gender: "Male" }));
    expect(row.gender.match).toBe("none");
    expect(row.gender.value).toBe("Female");
    expect(isSolvedRow(row)).toBe(false);
  });

  it("carries the guess's own value, not the answer's", () => {
    const row = compareClassic(champ({ resource: "Energy" }), champ({ resource: "Mana" }));
    expect(row.resource.value).toBe("Energy");
  });

  describe("multi-valued columns", () => {
    it("is exact only when the two sets are identical", () => {
      const row = compareClassic(
        champ({ positions: ["Top", "Mid"] }),
        champ({ positions: ["Mid", "Top"] })
      );
      expect(row.positions.match).toBe("exact");
    });

    it("is amber when the sets overlap without matching", () => {
      const row = compareClassic(
        champ({ regions: ["Noxus", "Shurima"] }),
        champ({ regions: ["Shurima"] })
      );
      expect(row.regions.match).toBe("partial");
    });

    it("is amber when the guess holds a subset of the answer's values", () => {
      const row = compareClassic(
        champ({ species: ["Human"] }),
        champ({ species: ["Human", "Spirit"] })
      );
      expect(row.species.match).toBe("partial");
    });

    it("is red when nothing is shared", () => {
      const row = compareClassic(champ({ classes: ["Mage"] }), champ({ classes: ["Tank"] }));
      expect(row.classes.match).toBe("none");
    });

    it("renders every value, so a partial tells the player which ones", () => {
      const row = compareClassic(
        champ({ regions: ["Noxus", "Shurima"] }),
        champ({ regions: ["Shurima"] })
      );
      expect(row.regions.value).toBe("Noxus, Shurima");
    });
  });

  describe("release year", () => {
    it("points up when the answer is newer than the guess", () => {
      const row = compareClassic(champ({ releaseYear: 2011 }), champ({ releaseYear: 2020 }));
      expect(row.releaseYear.hint).toBe("higher");
      expect(row.releaseYear.match).toBe("none");
    });

    it("points down when the answer is older", () => {
      const row = compareClassic(champ({ releaseYear: 2020 }), champ({ releaseYear: 2011 }));
      expect(row.releaseYear.hint).toBe("lower");
    });

    it("stops pointing once the year matches", () => {
      const row = compareClassic(champ({ releaseYear: 2015 }), champ({ releaseYear: 2015 }));
      expect(row.releaseYear.hint).toBe("equal");
      expect(row.releaseYear.match).toBe("exact");
    });
  });

  it("does not call a row solved when only the year is off", () => {
    // Two champions can agree on all seven other columns, so the year alone has
    // to be able to hold the row open.
    const row = compareClassic(champ({ releaseYear: 2011 }), champ({ releaseYear: 2020 }));
    expect(isSolvedRow(row)).toBe(false);
  });
});
