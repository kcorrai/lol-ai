import { getLessonById } from "@/domains/academy/curriculum";
import { CHAMPION_TRACK_ID } from "@/domains/academy/championLesson";
import { resolveChampionLesson } from "@/domains/academy/services/championLessonService";
import type { Lesson } from "@/domains/academy/types";

// One lookup for both kinds of lesson. Everything that grades an attempt or opens an assignment
// goes through here rather than through `getLessonById`, which only knows the registry — a
// champion lesson is generated and has no entry in it (ADR-030).

export interface ResolvedLesson {
  lesson: Lesson;
  /**
   * Set only for a champion lesson. Its assignment is measured on games played on that champion
   * alone: a lesson about Yasuo judged on every game in the role is not about Yasuo.
   */
  championId: number | null;
}

export function isChampionLessonId(lessonId: string): boolean {
  return lessonId.startsWith(`${CHAMPION_TRACK_ID}/`);
}

/**
 * The lesson behind an id, whoever wrote it. Champion lessons are rebuilt from the analysis that
 * is still cached and never from a fresh one, so an expired analysis resolves to null rather
 * than to a different set of drills wearing the same id.
 */
export async function resolveLesson(
  userId: string,
  lessonId: string
): Promise<ResolvedLesson | null> {
  if (!isChampionLessonId(lessonId)) {
    const lesson = getLessonById(lessonId);
    return lesson ? { lesson, championId: null } : null;
  }

  const resolved = await resolveChampionLesson(userId, lessonId);
  return resolved ? { lesson: resolved.lesson, championId: resolved.championId } : null;
}
