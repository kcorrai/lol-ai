import { prisma } from "@/lib/db/prisma";
import { TRACKS, lessonId } from "@/domains/academy/curriculum";
import type { LessonStatus } from "@/domains/academy/types";

// The record of what a player has actually done in the Academy: every lesson, its status, and
// when a mastery was earned. Read-only — nothing here writes progress.

export interface TranscriptLesson {
  lessonId: string;
  slug: string;
  title: string;
  status: LessonStatus;
  /** When the drills were passed. */
  completedAt: string | null;
  /** When the player's own matches proved it. Null unless it was ever mastered. */
  masteredAt: string | null;
}

export interface TranscriptTrack {
  trackId: string;
  title: string;
  total: number;
  completed: number;
  mastered: number;
  /** Every lesson in the track is completed or mastered — what a certificate requires. */
  finished: boolean;
  lessons: TranscriptLesson[];
}

export interface Transcript {
  tracks: TranscriptTrack[];
  totalLessons: number;
  totalCompleted: number;
  totalMastered: number;
  /** Academy XP paid out so far, summed from the rows that paid it. */
  xp: number;
}

const FINISHED: readonly LessonStatus[] = ["completed", "mastered"];

interface ProgressRow {
  lessonId: string;
  status: LessonStatus;
  completedAt: Date | null;
  masteredAt: Date | null;
  xpAwarded: number;
}

export async function getTranscript(userId: string): Promise<Transcript> {
  const rows = (await prisma.academyProgress.findMany({
    where: { userId },
    select: {
      lessonId: true,
      status: true,
      completedAt: true,
      masteredAt: true,
      xpAwarded: true,
    },
  })) as ProgressRow[];

  const byLesson = new Map(rows.map((r) => [r.lessonId, r]));

  const tracks = TRACKS.map((track) => {
    const lessons: TranscriptLesson[] = track.lessons.map((lesson) => {
      const id = lessonId(lesson);
      const row = byLesson.get(id);
      return {
        lessonId: id,
        slug: lesson.slug,
        title: lesson.title,
        status: row?.status ?? "available",
        completedAt: row?.completedAt?.toISOString() ?? null,
        masteredAt: row?.masteredAt?.toISOString() ?? null,
      };
    });

    const mastered = lessons.filter((l) => l.status === "mastered").length;
    return {
      trackId: track.id,
      title: track.title,
      total: lessons.length,
      completed: lessons.filter((l) => FINISHED.includes(l.status)).length,
      mastered,
      // A lesson that decayed to `review` is not finished — the certificate would be claiming
      // something the player's own games have stopped showing.
      finished: lessons.every((l) => FINISHED.includes(l.status)),
      lessons,
    };
  });

  return {
    tracks,
    totalLessons: tracks.reduce((sum, t) => sum + t.total, 0),
    totalCompleted: tracks.reduce((sum, t) => sum + t.completed, 0),
    totalMastered: tracks.reduce((sum, t) => sum + t.mastered, 0),
    xp: rows.reduce((sum, r) => sum + r.xpAwarded, 0),
  };
}

export interface Certificate {
  trackId: string;
  trackTitle: string;
  displayName: string;
  lessonsTotal: number;
  lessonsMastered: number;
  /** The latest completion in the track — the date the track was actually finished. */
  finishedAt: string;
}

/**
 * The certificate for a finished track, or null when it is not finished. Refusing to issue one
 * for a part-finished track is the point: a certificate that does not mean anything specific is
 * decoration, and the Academy already has a status for "you read most of it".
 */
export async function buildCertificate(
  userId: string,
  trackId: string
): Promise<Certificate | null> {
  const [transcript, user] = await Promise.all([
    getTranscript(userId),
    prisma.user.findUnique({ where: { id: userId }, select: { name: true } }),
  ]);

  const track = transcript.tracks.find((t) => t.trackId === trackId);
  if (!track || !track.finished) return null;

  const dates = track.lessons
    .map((l) => l.masteredAt ?? l.completedAt)
    .filter((d): d is string => d !== null)
    .sort();

  return {
    trackId: track.trackId,
    trackTitle: track.title,
    displayName: user?.name ?? "A LaneIQ player",
    lessonsTotal: track.total,
    lessonsMastered: track.mastered,
    finishedAt: dates[dates.length - 1] ?? new Date().toISOString(),
  };
}
