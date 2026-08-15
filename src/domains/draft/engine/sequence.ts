import type { DraftActionKind, DraftSide, DraftStep } from "./draft.types";

// Standard competitive tournament order (docs/DRAFT_ROOM.md §2). Written as a
// compact table so the shape stays readable; the slot numbers are derived rather
// than hand-written, which is where transcription bugs live.
const ORDER: ReadonlyArray<readonly [DraftSide, DraftActionKind]> = [
  ["BLUE", "BAN"], ["RED", "BAN"], ["BLUE", "BAN"], ["RED", "BAN"], ["BLUE", "BAN"], ["RED", "BAN"],
  ["BLUE", "PICK"], ["RED", "PICK"], ["RED", "PICK"], ["BLUE", "PICK"], ["BLUE", "PICK"], ["RED", "PICK"],
  ["RED", "BAN"], ["BLUE", "BAN"], ["RED", "BAN"], ["BLUE", "BAN"],
  ["RED", "PICK"], ["BLUE", "PICK"], ["BLUE", "PICK"], ["RED", "PICK"],
];

function buildSequence(): readonly DraftStep[] {
  const used = new Map<string, number>();
  return Object.freeze(
    ORDER.map(([side, kind], index) => {
      const bucket = `${side}:${kind}`;
      const slot = used.get(bucket) ?? 0;
      used.set(bucket, slot + 1);
      return Object.freeze({ index, side, kind, slot });
    })
  );
}

export const DRAFT_SEQUENCE: readonly DraftStep[] = buildSequence();

export const DRAFT_STEP_COUNT = DRAFT_SEQUENCE.length;

/** Slots per side, per kind — five bans and five picks each. */
export const SLOTS_PER_SIDE = 5;

export function stepAt(index: number): DraftStep | null {
  return DRAFT_SEQUENCE[index] ?? null;
}

export function isComplete(step: number): boolean {
  return step >= DRAFT_STEP_COUNT;
}

/**
 * The side whose turn it is at `step`, or null once the draft is finished.
 */
export function sideToAct(step: number): DraftSide | null {
  return stepAt(step)?.side ?? null;
}

export function opposingSide(side: DraftSide): DraftSide {
  return side === "BLUE" ? "RED" : "BLUE";
}
