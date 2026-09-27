import { DRAFT_SEQUENCE, type DraftSide, type DraftStep } from "@/domains/draft";

/**
 * The Draft Room demo's script: one full game of a draft, played in the room's own order.
 *
 * The order is not written out here. It is `DRAFT_SEQUENCE`, the table the real room enforces,
 * so the demo cannot drift into a pick order the product does not use.
 *
 * Champion names are display names that `normalizeChampionKey` resolves, and single words
 * wherever possible: a name Data Dragon keys differently (Kai'Sa → Kaisa, Wukong → MonkeyKing)
 * falls back to a letter tile if it is not in that map.
 */

export const DEMO_DRAFT: Record<DraftSide, { bans: readonly string[]; picks: readonly string[] }> =
  {
    BLUE: {
      bans: ["Azir", "Rumble", "Corki", "Poppy", "Rell"],
      picks: ["K'Sante", "Sejuani", "Orianna", "Ezreal", "Rakan"],
    },
    RED: {
      bans: ["Kalista", "Skarner", "Taliyah", "Leona", "Jax"],
      picks: ["Aatrox", "Vi", "Ahri", "Varus", "Nautilus"],
    },
  };

/** The room's real turn timer (`app/api/draft/route.ts`). The demo runs it fast. */
export const TURN_SECONDS = 30;

/**
 * Game 3 of a fearless series: the ten picks of each earlier game are off the table for both
 * teams (docs/DRAFT_ROOM.md §3), and bans do not carry.
 */
export const DEMO_GAME = 3;
export const DEMO_LOCKED_OUT = (DEMO_GAME - 1) * 10;

// Twenty turns in six seconds. `ArsenalTabs` moves to the next tab after seven, and a draft
// cut off at pick three never shows the thing it is for — both teams' full five.
export const DRAFT_STEP_MS = 300;
const HOLD_MS = 3800;
export const DRAFT_LOOP_MS = DRAFT_SEQUENCE.length * DRAFT_STEP_MS + HOLD_MS;

export interface DraftFrame {
  /** Steps already locked in, 0–20. */
  locked: number;
  /** The step being decided, or null once the draft is complete. */
  current: DraftStep | null;
  /** Seconds left on the current turn's clock. */
  seconds: number;
}

export const DRAFT_FINAL: DraftFrame = { locked: DRAFT_SEQUENCE.length, current: null, seconds: 0 };

export function draftFrame(elapsedMs: number): DraftFrame {
  const t = ((elapsedMs % DRAFT_LOOP_MS) + DRAFT_LOOP_MS) % DRAFT_LOOP_MS;
  const locked = Math.floor(t / DRAFT_STEP_MS);
  if (locked >= DRAFT_SEQUENCE.length) return DRAFT_FINAL;
  // Each turn burns a few seconds off a 30s clock before the champion locks, the way a quick
  // team drafts — the clock is there to show the room has one, not to hold the reader up.
  const into = (t % DRAFT_STEP_MS) / DRAFT_STEP_MS;
  return { locked, current: DRAFT_SEQUENCE[locked], seconds: TURN_SECONDS - Math.floor(into * 9) };
}

/** Whether a given side's ban or pick slot is filled at `locked` steps. */
export function isFilled(
  locked: number,
  side: DraftSide,
  kind: DraftStep["kind"],
  slot: number
): boolean {
  const step = DRAFT_SEQUENCE.findIndex(
    (s) => s.side === side && s.kind === kind && s.slot === slot
  );
  return step !== -1 && step < locked;
}
