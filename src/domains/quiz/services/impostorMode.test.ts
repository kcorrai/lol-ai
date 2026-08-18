import { describe, it, expect } from "vitest";
import {
  IMPOSTOR_BOARD_SIZE,
  IMPOSTOR_CATEGORIES,
  impostorBoard,
  impostorPool,
  impostorPrompt,
} from "@/domains/quiz/services/impostorMode";
import { answerFor } from "@/domains/quiz/services/puzzleService";
import type { QuizChampion } from "@/domains/quiz/types/quiz.types";

const DAYS = 400;

function dateKeys(count: number, from = "2026-01-01"): string[] {
  const start = new Date(`${from}T00:00:00.000Z`).getTime();
  return Array.from({ length: count }, (_, i) =>
    new Date(start + i * 86_400_000).toISOString().slice(0, 10)
  );
}

function valuesOf(champion: QuizChampion, category: string): readonly string[] {
  switch (category) {
    case "region":
      return champion.regions;
    case "class":
      return champion.classes;
    case "species":
      return champion.species;
    case "resource":
      return [champion.resource];
    case "range":
      return [champion.rangeType];
    case "position":
      return champion.positions;
    default:
      return [`${Math.floor(champion.releaseYear / 10) * 10}s`];
  }
}

const DAILY = dateKeys(DAYS).map((dateKey) => ({
  dateKey,
  answer: answerFor("impostor", dateKey),
}));

describe("the impostor board", () => {
  it("can hide every champion the mode deals", () => {
    expect(impostorPool().length).toBeGreaterThan(150);
    for (const { dateKey, answer } of DAILY) {
      expect(
        impostorPool().some((c) => c.id === answer.id),
        `${dateKey} dealt ${answer.id}`
      ).toBe(true);
    }
  });

  it("puts eight champions on the board, the answer among them", () => {
    for (const { dateKey, answer } of DAILY) {
      const board = impostorBoard(answer, dateKey);
      expect(board.candidates, dateKey).toHaveLength(IMPOSTOR_BOARD_SIZE);
      expect(new Set(board.candidates.map((c) => c.id)).size, dateKey).toBe(IMPOSTOR_BOARD_SIZE);
      expect(
        board.candidates.map((c) => c.id),
        dateKey
      ).toContain(answer.id);
    }
  });

  it("gives the trait to the other seven and to nobody else", () => {
    for (const { dateKey, answer } of DAILY) {
      const board = impostorBoard(answer, dateKey);
      const carriers = board.candidates.filter((c) =>
        valuesOf(c, board.trait.category).includes(board.trait.value)
      );
      expect(carriers, `${dateKey} · ${board.trait.category} ${board.trait.value}`).toHaveLength(7);
      expect(
        carriers.some((c) => c.id === answer.id),
        dateKey
      ).toBe(false);
    }
  });

  it("leaves no second champion who could equally be the impostor", () => {
    const ambiguous: string[] = [];
    for (const { dateKey, answer } of DAILY) {
      const board = impostorBoard(answer, dateKey);
      for (const category of IMPOSTOR_CATEGORIES) {
        const values = new Set(board.candidates.flatMap((c) => valuesOf(c, category)));
        for (const value of values) {
          const carriers = board.candidates.filter((c) => valuesOf(c, category).includes(value));
          if (carriers.length !== 7) continue;
          const oddOne = board.candidates.find((c) => !carriers.includes(c))!;
          if (oddOne.id !== answer.id) ambiguous.push(`${dateKey}: ${oddOne.id} (${category})`);
        }
      }
    }
    expect(ambiguous).toEqual([]);
  });

  it("spreads the answer across every slot, so its position gives nothing away", () => {
    const slots = new Map<number, number>();
    for (const { dateKey, answer } of DAILY) {
      const index = impostorBoard(answer, dateKey).candidates.findIndex((c) => c.id === answer.id);
      slots.set(index, (slots.get(index) ?? 0) + 1);
    }
    expect(slots.size).toBe(IMPOSTOR_BOARD_SIZE);
    // Eight slots over 400 days: a slot the shuffle barely reaches would be a tell.
    for (const [slot, count] of slots) {
      expect(count, `slot ${slot}`).toBeGreaterThan(DAYS / IMPOSTOR_BOARD_SIZE / 3);
    }
  });

  it("deals the same board all day, however often it is asked", () => {
    const { dateKey, answer } = DAILY[0];
    const first = impostorBoard(answer, dateKey).candidates.map((c) => c.id);
    expect(impostorBoard(answer, dateKey).candidates.map((c) => c.id)).toEqual(first);
  });
});

describe("the impostor clue ladder", () => {
  const { dateKey, answer } = DAILY[0];

  it("says nothing about the trait until the third miss", () => {
    for (const misses of [0, 1, 2]) {
      const prompt = impostorPrompt(answer, dateKey, misses);
      if (prompt.kind !== "impostor") throw new Error("expected an impostor prompt");
      expect(prompt.trait).toBeNull();
    }
  });

  it("names the category at three misses and the value at five", () => {
    const atThree = impostorPrompt(answer, dateKey, 3);
    const atFive = impostorPrompt(answer, dateKey, 5);
    if (atThree.kind !== "impostor" || atFive.kind !== "impostor") {
      throw new Error("expected impostor prompts");
    }
    expect(atThree.trait?.category).toBeTruthy();
    expect(atThree.trait?.value).toBeNull();
    expect(atFive.trait?.value).toBe(impostorBoard(answer, dateKey).trait.value);
  });

  it("carries nothing that marks the impostor", () => {
    const prompt = impostorPrompt(answer, dateKey, 0);
    if (prompt.kind !== "impostor") throw new Error("expected an impostor prompt");
    const serialised = JSON.stringify(prompt);
    expect(Object.keys(prompt).sort()).toEqual(["candidates", "kind", "trait"]);
    for (const candidate of prompt.candidates) {
      expect(Object.keys(candidate).sort()).toEqual(["id", "name"]);
    }
    expect(serialised).not.toContain("answer");
  });
});
