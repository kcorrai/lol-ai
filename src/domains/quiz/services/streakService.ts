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

/**
 * Records a finished mode and, when it was solved, advances the streak and grants
 * XP. One transaction, because a solve that banked XP but left the streak behind
 * is worse than one that did neither.
 */
export async function recordAttempt(
  userId: string,
  mode: QuizMode,
  guessCount: number,
  solved: boolean,
  now: Date
): Promise<QuizProgress> {
  const dateKey = utcDateKey(now);
  const puzzleDate = new Date(`${dateKey}T00:00:00.000Z`);

  await prisma.$transaction(async (tx) => {
    const existing = await tx.quizAttempt.findUnique({
      where: { userId_puzzleDate_mode: { userId, puzzleDate, mode } },
      select: { solved: true },
    });

    // Replaying a mode already finished today must not pay out twice.
    if (existing?.solved) return;

    await tx.quizAttempt.upsert({
      where: { userId_puzzleDate_mode: { userId, puzzleDate, mode } },
      create: {
        userId,
        puzzleDate,
        mode,
        guesses: [],
        guessCount,
        solved,
        gaveUp: !solved,
        completedAt: now,
      },
      update: { guessCount, solved, gaveUp: !solved, completedAt: now },
    });

    if (!solved) return;

    const streakRow = await tx.quizStreak.findUnique({ where: { userId } });
    const next = advanceStreak(toState(streakRow), dateKey);

    await tx.quizStreak.upsert({
      where: { userId },
      create: {
        userId,
        current: next.current,
        longest: next.longest,
        lastPlayedDate: puzzleDate,
        freezesLeft: next.freezesLeft,
        freezeWeekKey: next.freezeWeekKey,
      },
      update: {
        current: next.current,
        longest: next.longest,
        lastPlayedDate: puzzleDate,
        freezesLeft: next.freezesLeft,
        freezeWeekKey: next.freezeWeekKey,
      },
    });

    await awardXp(tx, userId, xpForSolve(guessCount));
  });

  return getProgress(userId, now);
}
