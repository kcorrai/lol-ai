import { describe, it, expect } from "vitest";
import lexicon from "@/domains/quiz/data/emojiLexicon.json";
import championEmoji from "@/domains/quiz/data/championEmoji.json";
import { allChampions, findChampion } from "@/domains/quiz/services/championPool";
import { EMOJI_PER_CHAMPION } from "@/domains/quiz/services/clueLadder";
import { explainEmoji, explainFor, explainImpostor } from "@/domains/quiz/services/explainService";
import { impostorBoard, valuesOf } from "@/domains/quiz/services/impostorMode";
import { answerFor, visibleEmoji } from "@/domains/quiz/services/puzzleService";
import type { QuizChampion } from "@/domains/quiz/types/quiz.types";

const LEXICON = lexicon as Record<string, string[] | undefined>;
const EMOJI = championEmoji as unknown as Record<string, string[] | undefined>;

function champion(id: string): QuizChampion {
  const found = findChampion(id);
  if (!found) throw new Error(`test fixture missing: ${id}`);
  return found;
}

describe("emoji lexicon", () => {
  it("covers every glyph the quiz can deal", () => {
    const glyphs = new Set(Object.values(EMOJI).flatMap((list) => list ?? []));
    const missing = [...glyphs].filter((glyph) => !LEXICON[glyph]);
    expect(missing).toEqual([]);
  });

  it("gives every glyph at least a word to show", () => {
    const empty = Object.entries(LEXICON).filter(([, terms]) => !terms || terms.length === 0);
    expect(empty).toEqual([]);
  });
});

describe("explainEmoji", () => {
  it("decodes every emoji the puzzle would have shown, in order", () => {
    const ahri = champion("Ahri");
    const explanation = explainEmoji(ahri);
    if (explanation.kind !== "emoji") throw new Error("wrong kind");

    expect(explanation.clues.map((c) => c.glyph)).toEqual(visibleEmoji(ahri, EMOJI_PER_CHAMPION));
    expect(explanation.clues).toHaveLength(EMOJI_PER_CHAMPION);
    expect(explanation.champion.name).toBe("Ahri");
    expect(explanation.champion.title).toBe(ahri.title);
  });

  it("points an emoji at the champion's own text rather than at prose about it", () => {
    const explanation = explainEmoji(champion("Ahri"));
    if (explanation.kind !== "emoji") throw new Error("wrong kind");

    const fox = explanation.clues.find((c) => c.label === "fox");
    expect(fox?.echo?.source).toBe("title");
    expect(fox?.echo?.text).toContain("Fox");

    const orb = explanation.clues.find((c) => c.label === "orb");
    expect(orb?.echo?.source).toBe("ability");
    expect(orb?.echo?.text).toContain("Orb of Deception");
  });

  it("finds the echo buried in a champion's name", () => {
    const explanation = explainEmoji(champion("Volibear"));
    if (explanation.kind !== "emoji") throw new Error("wrong kind");

    const bear = explanation.clues.find((c) => c.label === "bear");
    expect(bear?.echo).toEqual({ source: "name", text: "Volibear", term: "bear" });
  });

  it("quotes a term that is really in the text it quotes", () => {
    for (const c of allChampions()) {
      if (!EMOJI[c.id]) continue;
      const explanation = explainEmoji(c);
      if (explanation.kind !== "emoji") throw new Error("wrong kind");
      for (const clue of explanation.clues) {
        if (!clue.echo) continue;
        expect(clue.echo.text.toLowerCase()).toContain(clue.echo.term.toLowerCase());
      }
    }
  });

  it("marks a colour swatch as a colour rather than as a picture", () => {
    const explanation = explainEmoji(champion("Zac"));
    if (explanation.kind !== "emoji") throw new Error("wrong kind");

    expect(explanation.clues.find((c) => c.label === "green")?.kind).toBe("colour");
    expect(explanation.clues.some((c) => c.kind === "symbol")).toBe(true);
  });

  it("says nothing rather than inventing a link", () => {
    // A champion with no echo at all still gets a full ladder of labelled clues.
    for (const c of allChampions().slice(0, 40)) {
      if (!EMOJI[c.id]) continue;
      const explanation = explainEmoji(c);
      if (explanation.kind !== "emoji") throw new Error("wrong kind");
      for (const clue of explanation.clues) {
        expect(clue.label.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("explainImpostor", () => {
  const SCOPE = "2026-03-04";

  it("re-draws the board the player was looking at", () => {
    const answer = answerFor("impostor", SCOPE);
    const board = impostorBoard(answer, SCOPE);
    const explanation = explainImpostor(answer, SCOPE);
    if (explanation.kind !== "impostor") throw new Error("wrong kind");

    expect(explanation.candidates.map((c) => c.id)).toEqual(board.candidates.map((c) => c.id));
    expect(explanation.candidates.filter((c) => c.isImpostor)).toHaveLength(1);
    expect(explanation.value).toBe(board.trait.value);
  });

  it("puts the shared value on the seven and not on the impostor", () => {
    for (const dateKey of ["2026-03-04", "2026-06-18", "2026-11-02"]) {
      const answer = answerFor("impostor", dateKey);
      const explanation = explainImpostor(answer, dateKey);
      if (explanation.kind !== "impostor") throw new Error("wrong kind");

      for (const candidate of explanation.candidates) {
        const carries = candidate.values.includes(explanation.value);
        expect(carries).toBe(!candidate.isImpostor);
      }
      expect(explanation.impostorValues).toEqual([
        ...valuesOf(answer, impostorBoard(answer, dateKey).trait.category),
      ]);
    }
  });
});

describe("explainFor", () => {
  it("explains only the two modes that need it", () => {
    const dateKey = "2026-03-04";
    expect(explainFor("emoji", answerFor("emoji", dateKey), dateKey)?.kind).toBe("emoji");
    expect(explainFor("impostor", answerFor("impostor", dateKey), dateKey)?.kind).toBe("impostor");
    for (const mode of ["classic", "ability", "splash", "lore", "quote", "build"] as const) {
      expect(explainFor(mode, answerFor(mode, dateKey), dateKey)).toBeUndefined();
    }
  });
});
