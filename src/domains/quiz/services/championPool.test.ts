import { describe, it, expect } from "vitest";
import {
  DATASET_VERSION,
  allChampions,
  championIndex,
  findChampion,
  resolveGuess,
  splashPool,
} from "./championPool";

describe("the committed dataset", () => {
  it("carries the whole roster", () => {
    expect(allChampions().length).toBeGreaterThanOrEqual(173);
  });

  it("records the patch it was generated from", () => {
    expect(DATASET_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("leaves no champion without the attributes the Classic grid compares", () => {
    for (const champ of allChampions()) {
      expect(champ.gender, champ.id).toBeTruthy();
      expect(champ.species.length, champ.id).toBeGreaterThan(0);
      expect(champ.regions.length, champ.id).toBeGreaterThan(0);
      expect(champ.positions.length, champ.id).toBeGreaterThan(0);
      expect(champ.classes.length, champ.id).toBeGreaterThan(0);
      expect(champ.resource, champ.id).toBeTruthy();
      expect(champ.releaseYear, champ.id).toBeGreaterThan(2008);
      expect(champ.skinNums.length, champ.id).toBeGreaterThan(0);
    }
  });

  it("uses only the range values the grid knows how to render", () => {
    for (const champ of allChampions()) {
      expect(["Melee", "Ranged"]).toContain(champ.rangeType);
      expect(["Male", "Female", "Other"]).toContain(champ.gender);
    }
  });

  it("is sorted by name so the autocomplete needs no second pass", () => {
    const names = allChampions().map((c) => c.name);
    expect(names).toEqual(names.slice().sort((a, b) => a.localeCompare(b)));
  });
});

describe("resolveGuess", () => {
  it("matches the plain name", () => {
    expect(resolveGuess("Ahri")?.id).toBe("Ahri");
  });

  it("ignores case, spaces and punctuation", () => {
    for (const typed of ["kaisa", "Kai'Sa", "KAI SA", "  kai'sa  "]) {
      expect(resolveGuess(typed)?.id, typed).toBe("Kaisa");
    }
  });

  it("accepts the names players actually type", () => {
    expect(resolveGuess("Wukong")?.id).toBe("MonkeyKing");
    expect(resolveGuess("mundo")?.id).toBe("DrMundo");
    expect(resolveGuess("j4")?.id).toBe("JarvanIV");
    expect(resolveGuess("MF")?.id).toBe("MissFortune");
    expect(resolveGuess("asol")?.id).toBe("AurelionSol");
  });

  it("resolves the ampersand and apostrophe names both ways", () => {
    expect(resolveGuess("Nunu & Willump")?.id).toBe("Nunu");
    expect(resolveGuess("Nunu")?.id).toBe("Nunu");
    expect(resolveGuess("KogMaw")?.id).toBe("KogMaw");
    expect(resolveGuess("Kog'Maw")?.id).toBe("KogMaw");
  });

  it("returns null for a non-champion instead of guessing", () => {
    expect(resolveGuess("Gandalf")).toBeNull();
    expect(resolveGuess("")).toBeNull();
    expect(resolveGuess("   ")).toBeNull();
  });
});

describe("findChampion", () => {
  it("looks up by Data Dragon id, case-insensitively", () => {
    expect(findChampion("Aatrox")?.name).toBe("Aatrox");
    expect(findChampion("aatrox")?.name).toBe("Aatrox");
    expect(findChampion("nobody")).toBeNull();
  });
});

describe("championIndex", () => {
  it("exposes id and name only — the answer must not ride along", () => {
    const entry = championIndex()[0];
    expect(Object.keys(entry).sort()).toEqual(["id", "name"]);
  });

  it("covers every champion", () => {
    expect(championIndex().length).toBe(allChampions().length);
  });
});

describe("splashPool", () => {
  it("only offers champions that have splash art to show", () => {
    expect(splashPool().length).toBeGreaterThan(0);
    for (const champ of splashPool()) expect(champ.skinNums.length).toBeGreaterThan(0);
  });
});
