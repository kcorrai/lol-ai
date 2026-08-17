import { QUIZ_MODES, type QuizMode } from "@/domains/quiz/types/quiz.types";

// The share text. Wordle's emoji grid is the single biggest organic-growth lever
// this category has, and the research found no competitor shipping a verified
// one — so this is deliberately spoiler-free: it shows how hard the day was and
// nothing about who the answer was.

export interface ModeResult {
  mode: QuizMode;
  /** Guesses used. Undefined means the mode was not played at all. */
  guessCount?: number;
  solved: boolean;
}

const MODE_LABELS: Record<QuizMode, string> = {
  classic: "CLASSIC",
  ability: "ABILITY",
  splash: "SPLASH ",
  lore: "LORE   ",
  quote: "QUOTE  ",
  emoji: "EMOJI  ",
};

const LABEL_WIDTH = Math.max(...Object.values(MODE_LABELS).map((l) => l.length));
const MAX_SQUARES = 6;

/**
 * Green for the guess that landed, amber for the near misses it took to get
 * there, grey for a mode that was given up on. Capping the run at six keeps a
 * bad day from producing a wall of squares nobody wants to paste.
 */
function squares(result: ModeResult): string {
  if (result.guessCount === undefined) return "⬜";
  const misses = Math.max(0, result.guessCount - (result.solved ? 1 : 0));
  const shown = Math.min(misses, MAX_SQUARES - (result.solved ? 1 : 0));
  const overflow = misses > shown ? "…" : "";
  return "🟨".repeat(shown) + overflow + (result.solved ? "🟩" : "⬛");
}

function tally(result: ModeResult): string {
  if (result.guessCount === undefined) return "–";
  return result.solved ? String(result.guessCount) : "X";
}

export interface ShareGridInput {
  puzzleNumber: number;
  results: readonly ModeResult[];
  streak: number;
  url?: string;
}

/** Builds the block a player pastes into Discord or X. Pure. */
export function buildShareGrid({
  puzzleNumber,
  results,
  streak,
  url = "laneiq.gg/quiz",
}: ShareGridInput): string {
  const byMode = new Map(results.map((r) => [r.mode, r]));
  const lines = [`LaneIQ Daily #${puzzleNumber}`];

  for (const mode of QUIZ_MODES) {
    const result = byMode.get(mode) ?? { mode, solved: false };
    // Skip modes the player never opened rather than printing a row of blanks
    // for each — the grid should read as a scorecard, not a to-do list.
    if (result.guessCount === undefined) continue;
    lines.push(`${MODE_LABELS[mode].padEnd(LABEL_WIDTH)} ${squares(result)} ${tally(result)}`);
  }

  if (lines.length === 1) lines.push("nothing solved yet");
  if (streak > 0) lines.push(`🔥 ${streak}`);
  lines.push(url);

  return lines.join("\n");
}
