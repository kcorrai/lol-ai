import { describe, it, expect } from "vitest";
import { UnknownChampionError, judgeGuess, missCount, revealAnswer } from "./guessService";
import { answerFor, redactLore } from "./puzzleService";
import { findChampion } from "./championPool";
import { QUIZ_MODES } from "@/domains/quiz/types/quiz.types";

const NOW = new Date("2026-08-17T12:00:00Z");

describe("judgeGuess", () => {
  it("accepts the day's answer", () => {
    const answer = answerFor("classic", "2026-08-17");
    const result = judgeGuess("classic", answer.name, NOW);
    expect(result.correct).toBe(true);
    expect(result.answer?.id).toBe(answer.id);
  });

  it("withholds the answer while the guess is wrong", () => {
    const answer = answerFor("classic", "2026-08-17");
    const other = answer.id === "Ahri" ? "Garen" : "Ahri";
    const result = judgeGuess("classic", other, NOW);
    expect(result.correct).toBe(false);
    expect(result.answer).toBeUndefined();
  });

  it("rejects a name that is not a champion", () => {
    expect(() => judgeGuess("classic", "Gandalf", NOW)).toThrow(UnknownChampionError);
  });

  it("returns a grid row for Classic whether right or wrong", () => {
    const answer = answerFor("classic", "2026-08-17");
    expect(judgeGuess("classic", "Garen", NOW).row).toBeDefined();
    expect(judgeGuess("classic", answer.name, NOW).row).toBeDefined();
  });

  it("returns no grid row for the other modes", () => {
    for (const mode of QUIZ_MODES.filter((m) => m !== "classic")) {
      expect(judgeGuess(mode, "Garen", NOW).row, mode).toBeUndefined();
    }
  });

  it("resolves the guess to a canonical id, so casing cannot fork the record", () => {
    expect(judgeGuess("classic", "wukong", NOW).guess).toBe("MonkeyKing");
    expect(judgeGuess("classic", "kai'sa", NOW).guess).toBe("Kaisa");
  });

  describe("hints", () => {
    it("gives nothing away in the first few misses", () => {
      const misses = ["A", "B", "C"];
      expect(judgeGuess("splash", "Garen", NOW, misses).hint).toBeUndefined();
    });

    it("unlocks a clue once the player is properly stuck", () => {
      const misses = Array.from({ length: 6 }, (_, i) => `wrong-${i}`);
      const result = judgeGuess("splash", "Garen", NOW, misses);
      expect(result.hint).toBeTruthy();
    });

    it("never hints on Classic — the grid already is the hint", () => {
      const misses = Array.from({ length: 12 }, (_, i) => `wrong-${i}`);
      expect(judgeGuess("classic", "Garen", NOW, misses).hint).toBeUndefined();
    });

    it("widens the Lore clue only after the player is deeply stuck", () => {
      const answer = answerFor("lore", "2026-08-17");
      const wrong = answer.id === "Ahri" ? "Garen" : "Ahri";
      const at6 = judgeGuess("lore", wrong, NOW, Array.from({ length: 5 }, (_, i) => `w${i}`));
      const at9 = judgeGuess("lore", wrong, NOW, Array.from({ length: 8 }, (_, i) => `w${i}`));
      expect(at9.hint!.length).toBeGreaterThan(at6.hint!.length);
    });
  });
});

describe("revealAnswer", () => {
  it("hands over the answer when the player gives up", () => {
    const answer = answerFor("emoji", "2026-08-17");
    expect(revealAnswer("emoji", NOW)).toEqual({
      id: answer.id,
      name: answer.name,
      title: answer.title,
    });
  });
});

describe("missCount", () => {
  it("counts only the wrong guesses", () => {
    expect(missCount(["Ahri", "Garen", "Teemo"], "Teemo")).toBe(2);
    expect(missCount(["Teemo"], "Teemo")).toBe(0);
    expect(missCount([], "Teemo")).toBe(0);
  });
});

describe("redactLore", () => {
  it("blanks the champion's own name", () => {
    const ahri = findChampion("Ahri")!;
    expect(redactLore(ahri).toLowerCase()).not.toContain("ahri");
  });

  it("blanks ability names, which name the champion just as often", () => {
    const aatrox = findChampion("Aatrox")!;
    const redacted = redactLore(aatrox).toLowerCase();
    expect(redacted).not.toContain("aatrox");
    for (const ability of aatrox.abilities) {
      expect(redacted).not.toContain(ability.name.toLowerCase());
    }
  });

  it("leaves enough prose to be a puzzle rather than a wall of blocks", () => {
    for (const id of ["Ahri", "Garen", "Aatrox", "Lux", "Thresh"]) {
      const redacted = redactLore(findChampion(id)!);
      const blocks = (redacted.match(/▮▮▮/g) ?? []).length;
      expect(redacted.length, id).toBeGreaterThan(120);
      expect(blocks, id).toBeLessThan(redacted.split(/\s+/).length / 2);
    }
  });

  it("collapses adjacent redactions so the blanks do not leak a word count", () => {
    for (const id of ["AurelionSol", "MissFortune", "MonkeyKing"]) {
      expect(redactLore(findChampion(id)!)).not.toMatch(/▮▮▮\s+▮▮▮/);
    }
  });

  it("catches multi-word names without leaving a stub behind", () => {
    // "Aurelion Sol" must go before "Sol" can survive on its own.
    const redacted = redactLore(findChampion("AurelionSol")!).toLowerCase();
    expect(redacted).not.toContain("aurelion");
  });

  it("swallows the inflection instead of leaving the word shape behind", () => {
    // Both of these were real: Garen's "mighty broadsword" redacted to
    // "▮▮▮ y broadsword", and Aurelion Sol's "stars from the sky" to
    // "▮▮▮ s from the sky". Each hands back the ending of the hidden word.
    expect(redactLore(findChampion("Garen")!)).not.toMatch(/▮▮▮ y\b/);
    expect(redactLore(findChampion("AurelionSol")!)).not.toMatch(/▮▮▮ s\b/);
  });

  it("redacts the plural and adjectival forms of a term too", () => {
    const sett = findChampion("Sett")!;
    expect(redactLore({ ...sett, lore: "The Sett's arena. Setts everywhere." })).toBe(
      "The ▮▮▮ arena. ▮▮▮ everywhere."
    );
  });

  it("does not fire inside an unrelated word", () => {
    // Sett's name must not blank the "sett" in "settlement" or "settled".
    expect(redactLore({ ...findChampion("Sett")!, lore: "A quiet settlement settled here." })).toBe(
      "A quiet settlement settled here."
    );
  });
});

describe("every mode has a playable puzzle today", () => {
  it("deals an answer for all six", () => {
    for (const mode of QUIZ_MODES) {
      expect(answerFor(mode, "2026-08-17"), mode).toBeTruthy();
    }
  });
});
