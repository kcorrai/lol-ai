import { resolveGuess } from "@/domains/quiz/services/championPool";
import { compareClassic } from "@/domains/quiz/services/classicMode";
import { answerFor, hintFor } from "@/domains/quiz/services/puzzleService";
import { utcDateKey } from "@/domains/quiz/services/dailySeed";
import type { GuessResult, QuizChampion, QuizMode } from "@/domains/quiz/types/quiz.types";

// Guesses are judged on the server. The client is never told the answer, so the
// only way to see it is to solve the puzzle or give up — which is also why the
// puzzle endpoint carries no answer and the images go through a proxy that keeps
// the champion's name out of the URL.

export class UnknownChampionError extends Error {
  constructor(public readonly guess: string) {
    super(`"${guess}" is not a champion`);
    this.name = "UnknownChampionError";
  }
}

function reveal(answer: QuizChampion): GuessResult["answer"] {
  return { id: answer.id, name: answer.name, title: answer.title };
}

/**
 * Judges one guess against today's answer.
 *
 * `previousGuesses` only decides which hint has been unlocked, and hints are
 * derived from the answer's public attributes rather than from the answer
 * itself, so inflating the count cannot reveal more than guessing that many
 * times would have.
 */
export function judgeGuess(
  mode: QuizMode,
  rawGuess: string,
  now: Date,
  previousGuesses: readonly string[] = []
): GuessResult {
  const guess = resolveGuess(rawGuess);
  if (!guess) throw new UnknownChampionError(rawGuess);

  const answer = answerFor(mode, utcDateKey(now));
  const correct = guess.id === answer.id;

  const result: GuessResult = { guess: guess.id, correct };

  if (mode === "classic") {
    // The grid is the feedback, so Classic returns a row whether right or wrong.
    result.row = compareClassic(guess, answer);
  }

  if (correct) {
    result.answer = reveal(answer);
    return result;
  }

  // Misses counted after this one, so the first wrong guess unlocks the first hint.
  const misses = previousGuesses.filter((g) => g !== answer.id).length + 1;
  const hint = hintFor(mode, answer, misses);
  if (hint) result.hint = hint;

  return result;
}

/** Gives up on today's puzzle and reveals the answer. */
export function revealAnswer(mode: QuizMode, now: Date): NonNullable<GuessResult["answer"]> {
  return reveal(answerFor(mode, utcDateKey(now)));
}

/** How many wrong guesses precede a solve — what the share grid counts. */
export function missCount(guesses: readonly string[], answerId: string): number {
  return guesses.filter((g) => g !== answerId).length;
}
