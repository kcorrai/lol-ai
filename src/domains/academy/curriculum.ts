import { TRACKS } from "@/domains/academy/content/tracks";
import type { LeakTag, Lesson, LessonBlock, LessonStatus, Track, TrackId } from "@/domains/academy/types";

export { TRACKS };

/**
 * Globally unique lesson id. Slugs are only unique inside a track, and progress rows
 * are keyed across the whole curriculum — so everything stored uses `track/slug`.
 */
export function lessonId(lesson: Pick<Lesson, "trackId" | "slug">): string {
  return `${lesson.trackId}/${lesson.slug}`;
}

export function getTrack(trackId: string): Track | null {
  return TRACKS.find((t) => t.id === trackId) ?? null;
}

export function getLesson(trackId: string, slug: string): Lesson | null {
  return getTrack(trackId)?.lessons.find((l) => l.slug === slug) ?? null;
}

export function allLessons(): Lesson[] {
  return TRACKS.flatMap((t) => t.lessons);
}

export function getLessonById(id: string): Lesson | null {
  const [trackId, slug] = id.split("/");
  if (!trackId || !slug) return null;
  return getLesson(trackId, slug);
}

export interface LessonNeighbours {
  previous: Lesson | null;
  next: Lesson | null;
  /** 1-based position inside the track, for "Lesson 3 of 6". */
  index: number;
  total: number;
}

export function lessonNeighbours(lesson: Lesson): LessonNeighbours {
  const track = getTrack(lesson.trackId);
  const lessons = track?.lessons ?? [];
  const i = lessons.findIndex((l) => l.slug === lesson.slug);
  return {
    previous: i > 0 ? lessons[i - 1] : null,
    next: i >= 0 && i < lessons.length - 1 ? lessons[i + 1] : null,
    index: i + 1,
    total: lessons.length,
  };
}

/** Reading time for a whole track, used on the hub cards. */
export function trackMinutes(track: Track): number {
  return track.lessons.reduce((sum, l) => sum + l.minutes, 0);
}

const DONE: readonly LessonStatus[] = ["completed", "mastered"];

/** Share of a track's lessons that are completed or mastered, 0–1. */
export function trackCompletion(track: Track, statuses: Map<string, LessonStatus>): number {
  if (track.lessons.length === 0) return 0;
  const done = track.lessons.filter((l) => DONE.includes(statuses.get(lessonId(l)) ?? "available"));
  return done.length / track.lessons.length;
}

/**
 * Blocks a visitor may read. Free lessons are fully public — they are the SEO surface.
 * A pro lesson shows everything up to its `gate` marker, which is enough to be worth
 * indexing and enough to be worth paying for.
 */
export function visibleBlocks(lesson: Lesson, hasPro: boolean): LessonBlock[] {
  if (lesson.access === "free" || hasPro) {
    return lesson.blocks.filter((b) => b.kind !== "gate");
  }
  const gate = lesson.blocks.findIndex((b) => b.kind === "gate");
  return gate === -1 ? lesson.blocks : lesson.blocks.slice(0, gate);
}

export function isGated(lesson: Lesson, hasPro: boolean): boolean {
  return lesson.access === "pro" && !hasPro;
}

/** Drills a visitor may attempt — the gated half of a pro lesson keeps its drills back. */
export function visibleDrills(lesson: Lesson, hasPro: boolean): Lesson["drills"] {
  const shown = new Set(
    visibleBlocks(lesson, hasPro)
      .filter((b): b is Extract<LessonBlock, { kind: "drill" }> => b.kind === "drill")
      .map((b) => b.drillId)
  );
  return lesson.drills.filter((d) => shown.has(d.id));
}

/** Every lesson that claims to fix a given leak, in teaching order. */
export function lessonsForLeak(leak: LeakTag): Lesson[] {
  return allLessons().filter((l) => l.fixes.includes(leak));
}

export function trackIds(): TrackId[] {
  return TRACKS.map((t) => t.id);
}
