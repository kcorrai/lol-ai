import type { QuizMode } from "@/domains/quiz/types/quiz.types";

// What a player has earned so far, spelled out. The mechanics were already
// there — hintFor() hands out a region at five misses, the splash crop widens,
// the emoji string grows — but none of it was ever stated, so a stuck player
// had no reason to believe another guess would buy them anything.
//
// These ladders mirror puzzleService.hintFor, PuzzlePrompt's splash crop and
// visibleEmoji. They describe the clue, never the answer, so building one on
// the client leaks nothing.

export interface ClueStep {
  /** Misses needed before this step is handed over. */
  at: number;
  text: string;
  unlocked: boolean;
}

type LadderMode = Exclude<QuizMode, "classic">;

const LADDERS: Record<LadderMode, readonly { at: number; text: string }[]> = {
  ability: [
    { at: 0, text: "One ability icon" },
    { at: 5, text: "The champion's position" },
  ],
  splash: [
    { at: 0, text: "Splash art, tightly cropped" },
    { at: 2, text: "The crop widens" },
    { at: 4, text: "It widens again" },
    { at: 5, text: "The champion's position" },
    { at: 6, text: "The full splash" },
  ],
  lore: [
    { at: 0, text: "Full lore, names redacted" },
    { at: 5, text: "The champion's region" },
    { at: 8, text: "Region and class" },
  ],
  quote: [
    { at: 0, text: "One voice line" },
    { at: 5, text: "The champion's region" },
    { at: 8, text: "Region and class" },
  ],
  // Every champion in championEmoji.json carries exactly EMOJI_PER_CHAMPION
  // emoji, so the ladder can promise all five without checking today's answer.
  emoji: [
    { at: 0, text: "The first emoji" },
    { at: 1, text: "A second emoji" },
    { at: 2, text: "A third emoji" },
    { at: 3, text: "A fourth emoji" },
    { at: 4, text: "The fifth emoji" },
    { at: 5, text: "The champion's position" },
  ],
};

/** How many emoji clues one champion has — the same for all of them. */
export const EMOJI_PER_CHAMPION = 5;

/**
 * The clue ladder for one mode at one miss count. Classic returns nothing: its
 * grid is the clue, and every column is compared from the very first guess.
 */
export function clueLadder(mode: QuizMode, misses: number): ClueStep[] {
  if (mode === "classic") return [];
  return LADDERS[mode].map((step) => ({ ...step, unlocked: misses >= step.at }));
}

/** The line under the ladder: what the next miss is worth, if anything. */
export function nextClueNote(mode: QuizMode, misses: number): string {
  const next = clueLadder(mode, misses).find((step) => !step.unlocked);
  if (!next) return "Every clue is out — the rest is on you";
  const more = next.at - misses;
  return more === 1 ? "Next clue on your next miss" : `Next clue after ${more} more misses`;
}
