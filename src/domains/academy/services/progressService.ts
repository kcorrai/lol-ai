import { prisma } from "@/lib/db/prisma";
import { awardXp } from "@/domains/analysis";
import { visibleDrills } from "@/domains/academy/curriculum";
import { resolveLesson } from "@/domains/academy/services/lessonResolver";
import { xpToAward } from "@/domains/academy/xp";
import { scoreLesson, type DrillAttempt, type LessonScore } from "@/domains/academy/drills/scoring";
import type { LessonProgress, LessonStatus } from "@/domains/academy/types";

export async function getLessonStatuses(userId: string): Promise<Map<string, LessonStatus>> {
  const rows = await prisma.academyProgress.findMany({
    where: { userId },
    select: { lessonId: true, status: true },
  });
  return new Map(rows.map((r) => [r.lessonId, r.status]));
}

export async function getLessonProgress(
  userId: string,
  lessonId: string
): Promise<LessonProgress | null> {
  const row = await prisma.academyProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
  });
  if (!row) return null;

  return {
    lessonId: row.lessonId,
    status: row.status,
    attempts: row.attempts,
    bestScore: row.bestScore,
    completedAt: row.completedAt?.toISOString() ?? null,
  };
}

/** Opening a lesson marks it in progress, but never demotes one already finished. */
export async function markLessonOpened(userId: string, lessonId: string): Promise<void> {
  await prisma.academyProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    create: { userId, lessonId, status: "in_progress" },
    update: { lastSeenAt: new Date() },
  });
}

export interface SubmitResult {
  score: LessonScore;
  progress: LessonProgress;
  /** XP granted by this attempt. Zero for a lesson that has already been paid for. */
  xpAwarded: number;
}

/**
 * Grades an attempt and stores it. A failed attempt still counts — it leaves the lesson
 * in progress with the attempt recorded, so a player can see they have been here before.
 */
export async function submitLessonAttempt(
  userId: string,
  lessonId: string,
  attempts: DrillAttempt[],
  hasPro: boolean
): Promise<SubmitResult> {
  // A champion lesson resolves from the analysis it was generated from, which is still cached.
  // Null there means that analysis has expired and these drills no longer exist — grading the
  // answers against a freshly generated set would mark right answers wrong.
  const resolved = await resolveLesson(userId, lessonId);
  if (!resolved) throw new Error(`Unknown lesson: ${lessonId}`);
  const { lesson } = resolved;

  // Graded on the half the reader was shown. Grading a free reader against drills behind
  // the pro gate would fail them for content they were never offered.
  const score = scoreLesson(visibleDrills(lesson, hasPro), attempts);
  const existing = await prisma.academyProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { bestScore: true, status: true, completedAt: true, xpAwarded: true },
  });

  // Mastery is earned from real matches, not from a drill — a completed lesson stays
  // completed here and only academyAssignment can lift it to mastered.
  const alreadyMastered = existing?.status === "mastered";
  const status: LessonStatus = alreadyMastered
    ? "mastered"
    : score.passed
      ? "completed"
      : "in_progress";

  // XP and the row move together or not at all: granting XP for a completion the upsert then
  // failed to store would pay a player for a lesson that still reads as unfinished.
  const owed = status === "in_progress" ? 0 : xpToAward(existing?.xpAwarded ?? 0, status);

  const row = await prisma.$transaction(async (tx) => {
    const saved = await tx.academyProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status,
        attempts: 1,
        bestScore: score.score,
        completedAt: score.passed ? new Date() : null,
        xpAwarded: owed,
      },
      update: {
        status,
        attempts: { increment: 1 },
        bestScore: Math.max(existing?.bestScore ?? 0, score.score),
        completedAt: existing?.completedAt ?? (score.passed ? new Date() : null),
        lastSeenAt: new Date(),
        ...(owed > 0 ? { xpAwarded: { increment: owed } } : {}),
      },
    });

    if (owed > 0) await awardXp(tx, userId, owed);
    return saved;
  });

  return {
    score,
    xpAwarded: owed,
    progress: {
      lessonId: row.lessonId,
      status: row.status,
      attempts: row.attempts,
      bestScore: row.bestScore,
      completedAt: row.completedAt?.toISOString() ?? null,
    },
  };
}
