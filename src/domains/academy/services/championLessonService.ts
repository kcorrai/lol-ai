import { getCachedOtpAnalysis, getOtpAnalysis, getRecommendedOtps } from "@/domains/otp";
import { buildChampionLesson, championSlug, CHAMPION_TRACK_ID } from "@/domains/academy/championLesson";
import { positionFromRole, roleFromPosition } from "@/domains/academy/roles";
import { primaryRiotAccountId } from "@/domains/academy/services/assignmentReadings";
import type { Lesson, RoleId } from "@/domains/academy/types";

// Champion lessons are generated, so this is the only place that decides *which* ones may
// exist. The rule is one line long and does all the work: a lesson is generated only for a
// champion this player has actually been playing, in the role they play it (ADR-030). That
// keeps the feature personal rather than a champion wiki, and keeps an AI call off any URL a
// stranger can type.

/** How many of the player's champions the Academy will offer lessons for. */
const OFFERED = 6;

export interface ChampionOption {
  champion: string;
  slug: string;
  role: RoleId;
  games: number;
  winRate: number;
}

export interface ChampionLessonView extends ChampionOption {
  lesson: Lesson;
}

/** The player's own champions, most worth one-tricking first. Empty without a linked account. */
export async function listChampionOptions(userId: string | null): Promise<ChampionOption[]> {
  if (!userId) return [];
  const riotAccountId = await primaryRiotAccountId(userId);
  if (!riotAccountId) return [];

  const recommended = await getRecommendedOtps(riotAccountId, OFFERED).catch(() => []);

  return recommended.flatMap((entry) => {
    const role = roleFromPosition(entry.position);
    if (!role) return [];
    return [
      {
        champion: entry.name,
        slug: championSlug(entry.name),
        role,
        games: entry.games,
        winRate: entry.winRate,
      },
    ];
  });
}

async function optionForSlug(userId: string, slug: string): Promise<ChampionOption | null> {
  const options = await listChampionOptions(userId);
  return options.find((o) => o.slug === slug) ?? null;
}

/**
 * The lesson for one of the player's champions, generating the analysis if it is not cached.
 * Null when the champion is not one of theirs, or when the analysis came back too thin to build
 * a lesson from — an empty page is a better answer than a lesson with unanswerable drills.
 */
export async function getChampionLesson(
  userId: string,
  slug: string
): Promise<ChampionLessonView | null> {
  const option = await optionForSlug(userId, slug);
  if (!option) return null;

  const analysis = await getOtpAnalysis(option.champion, positionFromRole(option.role)).catch(() => null);
  if (!analysis) return null;

  const lesson = buildChampionLesson({ champion: option.champion, role: option.role, analysis });
  return lesson ? { ...option, lesson } : null;
}

/**
 * The lesson behind a stored `champion/…` progress id, rebuilt from the **cached** analysis and
 * never from a fresh one. A miss means the analysis this lesson was generated from has expired,
 * so the drills the player is holding no longer exist — grading them against a newly generated
 * set would mark answers wrong that were right when they were given.
 */
export async function resolveChampionLesson(
  userId: string,
  lessonId: string
): Promise<Lesson | null> {
  const [trackId, slug] = lessonId.split("/");
  if (trackId !== CHAMPION_TRACK_ID || !slug) return null;

  // `slug` is `<champion>-<role>`; the role is the last segment and the champion has none.
  const cut = slug.lastIndexOf("-");
  if (cut <= 0) return null;

  const option = await optionForSlug(userId, slug.slice(0, cut));
  if (!option || option.role !== slug.slice(cut + 1)) return null;

  const analysis = await getCachedOtpAnalysis(option.champion, positionFromRole(option.role));
  if (!analysis) return null;

  return buildChampionLesson({ champion: option.champion, role: option.role, analysis });
}
