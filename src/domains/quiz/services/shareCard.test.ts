import { describe, it, expect } from "vitest";
import {
  buildShareCard,
  parseShareResults,
  shareCardParams,
} from "@/domains/quiz/services/shareCard";
import { allChampions } from "@/domains/quiz/services/championPool";
import { QUIZ_MODES } from "@/domains/quiz/types/quiz.types";
import type { ModeResult } from "@/domains/quiz/services/shareGrid";

const DAY: ModeResult[] = [
  { mode: "classic", guessCount: 4, solved: true },
  { mode: "splash", guessCount: 9, solved: false },
  { mode: "emoji", guessCount: 1, solved: true },
];

describe("buildShareCard", () => {
  it("carries every mode, played or not", () => {
    const card = buildShareCard({ puzzleNumber: 985, results: DAY, streak: 12 });

    expect(card.rows.map((r) => r.mode)).toEqual([...QUIZ_MODES]);
    expect(card.total).toBe(QUIZ_MODES.length);
    expect(card.played).toBe(3);
    expect(card.solved).toBe(2);
  });

  it("draws the misses, then how the mode ended", () => {
    const card = buildShareCard({ puzzleNumber: 985, results: DAY, streak: 0 });
    const classic = card.rows.find((r) => r.mode === "classic");

    expect(classic?.tiles).toEqual(["miss", "miss", "miss", "hit"]);
    expect(classic?.tally).toBe("4");
    expect(classic?.overflow).toBe(false);
  });

  it("caps a long run rather than drawing a wall of squares", () => {
    const card = buildShareCard({ puzzleNumber: 985, results: DAY, streak: 0 });
    const splash = card.rows.find((r) => r.mode === "splash");

    expect(splash?.tiles).toHaveLength(6);
    expect(splash?.tiles.at(-1)).toBe("fail");
    expect(splash?.overflow).toBe(true);
    expect(splash?.tally).toBe("X");
  });

  it("leaves an unplayed mode blank instead of counting it as a loss", () => {
    const card = buildShareCard({ puzzleNumber: 985, results: DAY, streak: 0 });
    const lore = card.rows.find((r) => r.mode === "lore");

    expect(lore?.played).toBe(false);
    expect(lore?.tiles).toEqual([]);
    expect(lore?.tally).toBe("–");
  });

  it("names no champion anywhere — the card is posted before friends have played", () => {
    const card = buildShareCard({ puzzleNumber: 985, results: DAY, streak: 12 });
    const serialised = JSON.stringify(card);

    for (const champion of allChampions()) {
      expect(serialised).not.toContain(champion.name);
    }
  });
});

describe("shareCardParams / parseShareResults", () => {
  it("round-trips a day", () => {
    const query = new URLSearchParams(
      shareCardParams({ puzzleNumber: 985, results: DAY, streak: 12 })
    );

    expect(query.get("n")).toBe("985");
    expect(query.get("s")).toBe("12");
    expect(parseShareResults(query.get("r") ?? "")).toEqual(DAY);
  });

  it("omits the run list when nothing was played", () => {
    const query = new URLSearchParams(shareCardParams({ puzzleNumber: 1, results: [], streak: 0 }));

    expect(query.get("r")).toBeNull();
    expect(parseShareResults("")).toEqual([]);
  });

  it("drops junk rather than failing the card", () => {
    expect(parseShareResults("99-3-1.0-x-1.0-4-1.")).toEqual([
      { mode: "classic", guessCount: 4, solved: true },
    ]);
  });

  it("keeps a mode that was given up on before a single guess", () => {
    const given: ModeResult[] = [{ mode: "emoji", guessCount: 0, solved: false }];
    const query = new URLSearchParams(
      shareCardParams({ puzzleNumber: 985, results: given, streak: 0 })
    );

    expect(parseShareResults(query.get("r") ?? "")).toEqual(given);
    const row = buildShareCard({ puzzleNumber: 985, results: given, streak: 0 }).rows.find(
      (r) => r.mode === "emoji"
    );
    expect(row?.played).toBe(true);
    expect(row?.tiles).toEqual(["fail"]);
    expect(row?.tally).toBe("X");
  });
});
