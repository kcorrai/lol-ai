import type { Position } from "@prisma/client";
import { getLessonById } from "@/domains/academy/curriculum";
import { positionFromRole } from "@/domains/academy/roles";
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
  /**
   * The role a champion lesson is about — the role that champion is played in, which is not
   * always the account's main role, and is the population its assignment has to be judged from.
   * Null for the authored curriculum, whose assignments read the account's main role.
   */
  position: Position | null;
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
    return lesson ? { lesson, championId: null, position: null } : null;
  }

  const resolved = await resolveChampionLesson(userId, lessonId);
  if (!resolved) return null;

  return {
    lesson: resolved.lesson,
    championId: resolved.championId,
    position: positionFromRole(resolved.role),
  };
}
