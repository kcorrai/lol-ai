import { prisma } from "@/lib/db/prisma";
import { awardXp } from "@/domains/analysis";
import {
  INITIAL_STREAK,
  advanceStreak,
  streakStatus,
  type StreakState,
} from "@/domains/quiz/services/streakRules";
import { nextResetAt, utcDateKey } from "@/domains/quiz/services/dailySeed";
import type { QuizMode } from "@/domains/quiz/types/quiz.types";

// Persistence for signed-in players. The rules themselves live in streakRules.ts
// and are pure; this file only moves them in and out of the database.

/** Solving faster is worth more, floored so a hard day is still worth playing. */
const XP_FIRST_TRY = 60;
const XP_MIN = 15;

export function xpForSolve(guessCount: number): number {
  return Math.max(XP_MIN, XP_FIRST_TRY - (guessCount - 1) * 8);
}

export interface QuizProgress {
  streak: StreakState & { status: "current" | "at-risk" | "broken" };
  today: { mode: string; solved: boolean; guessCount: number }[];
  nextResetAt: string;
}

function toState(row: {
  current: number;
  longest: number;
  lastPlayedDate: Date | null;
  freezesLeft: number;
  freezeWeekKey: string | null;
} | null): StreakState {
  if (!row) return INITIAL_STREAK;
  return {
    current: row.current,
    longest: row.longest,
    lastPlayedDate: row.lastPlayedDate ? utcDateKey(row.lastPlayedDate) : null,
    freezesLeft: row.freezesLeft,
    freezeWeekKey: row.freezeWeekKey,
  };
}

export async function getProgress(userId: string, now: Date): Promise<QuizProgress> {
  const dateKey = utcDateKey(now);
  const [streakRow, attempts] = await Promise.all([
    prisma.quizStreak.findUnique({ where: { userId } }),
    prisma.quizAttempt.findMany({
      where: { userId, puzzleDate: new Date(`${dateKey}T00:00:00.000Z`) },
      select: { mode: true, solved: true, guessCount: true },
    }),
  ]);

  const state = toState(streakRow);
  return {
    streak: { ...state, status: streakStatus(state, dateKey) },
    today: attempts,
    nextResetAt: nextResetAt(now).toISOString(),
  };
}

function puzzleDateOf(dateKey: string): Date {
  return new Date(`${dateKey}T00:00:00.000Z`);
}

/**
 * Records one guess, and on a correct one closes the mode out — streak, XP and
 * all — in a single transaction, because a solve that banked XP but left the
 * streak behind is worse than one that did neither.
 *
 * The guess is appended here rather than counted by the client. That used to be
 * a matter of taste; with a leaderboard ranked on fewest guesses it is the whole
 * thing, since a client-reported count is a ranking anyone can top by editing a
 * request. `guessCount` is derived from the stored list and never trusted from
 * outside.
 */
export async function recordGuess(
  userId: string,
  mode: QuizMode,
  guessId: string,
  correct: boolean,
  now: Date
): Promise<void> {
  const dateKey = utcDateKey(now);
  const puzzleDate = puzzleDateOf(dateKey);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.quizAttempt.findUnique({
      where: { userId_puzzleDate_mode: { userId, puzzleDate, mode } },
      select: { guesses: true, solved: true, gaveUp: true },
    });

    // A mode already closed out today cannot be played again for more credit.
    if (existing?.solved || existing?.gaveUp) return;

    // Repeat guesses do not lengthen the list — the client blocks them, but the
    // count is a score now, so the server does not take its word for it.
    const guesses = existing?.guesses ?? [];
    const next = guesses.includes(guessId) ? guesses : [...guesses, guessId];

    await tx.quizAttempt.upsert({
      where: { userId_puzzleDate_mode: { userId, puzzleDate, mode } },
      create: {
        userId,
        puzzleDate,
        mode,
        guesses: next,
        guessCount: next.length,
        solved: correct,
        completedAt: correct ? now : null,
      },
      update: {
        guesses: next,
        guessCount: next.length,
        solved: correct,
        completedAt: correct ? now : null,
      },
    });

    if (!correct) return;

    const streakRow = await tx.quizStreak.findUnique({ where: { userId } });
    const advanced = advanceStreak(toState(streakRow), dateKey);

    await tx.quizStreak.upsert({
      where: { userId },
      create: {
        userId,
        current: advanced.current,
        longest: advanced.longest,
        lastPlayedDate: puzzleDate,
        freezesLeft: advanced.freezesLeft,
        freezeWeekKey: advanced.freezeWeekKey,
      },
      update: {
        current: advanced.current,
        longest: advanced.longest,
        lastPlayedDate: puzzleDate,
        freezesLeft: advanced.freezesLeft,
        freezeWeekKey: advanced.freezeWeekKey,
      },
    });

    await awardXp(tx, userId, xpForSolve(next.length));
  });
}

/** Closes a mode out unsolved. No streak, no XP, and no leaderboard standing. */
export async function recordGiveUp(userId: string, mode: QuizMode, now: Date): Promise<void> {
  const puzzleDate = puzzleDateOf(utcDateKey(now));

  const existing = await prisma.quizAttempt.findUnique({
    where: { userId_puzzleDate_mode: { userId, puzzleDate, mode } },
    select: { solved: true, guesses: true },
  });
  if (existing?.solved) return;

  await prisma.quizAttempt.upsert({
    where: { userId_puzzleDate_mode: { userId, puzzleDate, mode } },
    create: {
      userId,
      puzzleDate,
      mode,
      guesses: [],
      guessCount: 0,
      solved: false,
      gaveUp: true,
      completedAt: now,
    },
    update: { gaveUp: true, completedAt: now },
  });
}
