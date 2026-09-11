import { QUIZ_MODES, isQuizMode, type QuizMode } from "@/domains/quiz/types/quiz.types";
import type { ModeResult } from "@/domains/quiz/services/shareGrid";

// The day's scorecard, as a picture rather than as pasted text.
//
// `shareGrid.ts` still builds the Wordle-style block — it is what a player pastes
// into Discord — but a block of monospace squares is a poor last thing to look at
// after solving, and it is not something anyone shares on purpose. This module is
// the model behind the drawn card: pure, so the page and the image route are
// working from exactly the same numbers, and free of champion names, so the card
// is safe to post before anyone else has played.

/** One square in a mode's run. */
export type ShareTile = "miss" | "hit" | "fail";

export interface ShareCardRow {
  mode: QuizMode;
  label: string;
  tiles: ShareTile[];
  /** True when the run was longer than the card can draw. */
  overflow: boolean;
  /** "4", "X", or "–" for a mode that was never opened. */
  tally: string;
  played: boolean;
}

export interface ShareCardModel {
  puzzleNumber: number;
  streak: number;
  solved: number;
  played: number;
  total: number;
  rows: ShareCardRow[];
}

export interface ShareCardInput {
  puzzleNumber: number;
  results: readonly ModeResult[];
  streak: number;
}

const MODE_LABELS: Record<QuizMode, string> = {
  classic: "CLASSIC",
  ability: "ABILITY",
  splash: "SPLASH",
  lore: "LORE",
  quote: "QUOTE",
  emoji: "EMOJI",
  build: "BUILD",
  impostor: "IMPOSTOR",
};

/** Six squares is where a bad day stops being readable at a glance. */
const MAX_TILES = 6;

function tilesFor(result: ModeResult): { tiles: ShareTile[]; overflow: boolean } {
  if (result.guessCount === undefined) return { tiles: [], overflow: false };

  const misses = Math.max(0, result.guessCount - (result.solved ? 1 : 0));
  const room = MAX_TILES - 1;
  const shown = Math.min(misses, room);
  const tiles: ShareTile[] = Array.from({ length: shown }, () => "miss");
  tiles.push(result.solved ? "hit" : "fail");

  return { tiles, overflow: misses > shown };
}

function tally(result: ModeResult): string {
  if (result.guessCount === undefined) return "–";
  return result.solved ? String(result.guessCount) : "X";
}

/** Every mode in play order, whether it was opened today or not — the blanks are
 *  the reason to come back before midnight. */
export function buildShareCard({ puzzleNumber, results, streak }: ShareCardInput): ShareCardModel {
  const byMode = new Map(results.map((r) => [r.mode, r]));

  const rows = QUIZ_MODES.map((mode) => {
    const result = byMode.get(mode) ?? { mode, solved: false };
    const { tiles, overflow } = tilesFor(result);
    return {
      mode,
      label: MODE_LABELS[mode],
      tiles,
      overflow,
      tally: tally(result),
      played: result.guessCount !== undefined,
    };
  });

  return {
    puzzleNumber,
    streak,
    solved: rows.filter((r) => r.tiles.includes("hit")).length,
    played: rows.filter((r) => r.played).length,
    total: QUIZ_MODES.length,
    rows,
  };
}

/**
 * The card's whole state in a query string: puzzle number, streak, and one
 * `mode-guesses-solved` triple per played mode. Nothing here is secret and
 * nothing is worth signing — the worst a forged link can do is draw a day that
 * did not happen, on a card that names no champion either way.
 */
export function shareCardParams({ puzzleNumber, results, streak }: ShareCardInput): string {
  const played = results.filter((r) => r.guessCount !== undefined);
  const runs = played
    .map((r) => `${QUIZ_MODES.indexOf(r.mode)}-${r.guessCount}-${r.solved ? 1 : 0}`)
    .join(".");

  const params = new URLSearchParams({ n: String(puzzleNumber), s: String(streak) });
  if (runs) params.set("r", runs);
  return params.toString();
}

/** Reads back what `shareCardParams` wrote, dropping anything malformed rather
 *  than failing the image. */
export function parseShareResults(raw: string): ModeResult[] {
  if (!raw) return [];

  const results: ModeResult[] = [];
  for (const run of raw.split(".")) {
    const [index, guesses, solved] = run.split("-");
    const mode = QUIZ_MODES[Number(index)];
    const guessCount = Number(guesses);
    if (!mode || !isQuizMode(mode)) continue;
    // Zero is a real count: giving up without guessing still played the mode.
    if (!Number.isInteger(guessCount) || guessCount < 0 || guessCount > 200) continue;
    results.push({ mode, guessCount, solved: solved === "1" });
  }
  return results;
}
