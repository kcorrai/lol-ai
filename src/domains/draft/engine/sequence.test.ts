import { describe, expect, it } from "vitest";
import {
  DRAFT_SEQUENCE,
  DRAFT_STEP_COUNT,
  isComplete,
  opposingSide,
  sideToAct,
  stepAt,
} from "./sequence";
import type { DraftActionKind, DraftSide } from "./draft.types";

// The literal order from docs/DRAFT_ROOM.md §2, written out by hand so the test
// fails if the generated table ever drifts from the spec.
const EXPECTED: ReadonlyArray<`${DraftSide}-${DraftActionKind}`> = [
  "BLUE-BAN", "RED-BAN", "BLUE-BAN", "RED-BAN", "BLUE-BAN", "RED-BAN",
  "BLUE-PICK", "RED-PICK", "RED-PICK", "BLUE-PICK", "BLUE-PICK", "RED-PICK",
  "RED-BAN", "BLUE-BAN", "RED-BAN", "BLUE-BAN",
  "RED-PICK", "BLUE-PICK", "BLUE-PICK", "RED-PICK",
];

describe("draft sequence", () => {
  it("is the 20-step tournament order from the spec", () => {
    expect(DRAFT_STEP_COUNT).toBe(20);
    expect(DRAFT_SEQUENCE.map((s) => `${s.side}-${s.kind}`)).toEqual(EXPECTED);
  });

  it("gives each side five bans and five picks", () => {
    for (const side of ["BLUE", "RED"] as const) {
      const mine = DRAFT_SEQUENCE.filter((s) => s.side === side);
      expect(mine.filter((s) => s.kind === "BAN")).toHaveLength(5);
      expect(mine.filter((s) => s.kind === "PICK")).toHaveLength(5);
    }
  });

  it("numbers slots 0-4 within each side and kind, without gaps or repeats", () => {
    for (const side of ["BLUE", "RED"] as const) {
      for (const kind of ["BAN", "PICK"] as const) {
        const slots = DRAFT_SEQUENCE.filter((s) => s.side === side && s.kind === kind).map(
          (s) => s.slot
        );
        expect([...slots].sort()).toEqual([0, 1, 2, 3, 4]);
      }
    }
  });

  it("indexes every step by its own position", () => {
    DRAFT_SEQUENCE.forEach((step, i) => expect(step.index).toBe(i));
  });

  it("reports the acting side and completion", () => {
    expect(sideToAct(0)).toBe("BLUE");
    expect(sideToAct(19)).toBe("RED");
    expect(sideToAct(20)).toBeNull();
    expect(stepAt(20)).toBeNull();
    expect(isComplete(19)).toBe(false);
    expect(isComplete(20)).toBe(true);
  });

  it("flips sides", () => {
    expect(opposingSide("BLUE")).toBe("RED");
    expect(opposingSide("RED")).toBe("BLUE");
  });
});
