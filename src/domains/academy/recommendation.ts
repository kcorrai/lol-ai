import { allLessons, getTrack, lessonId } from "@/domains/academy/curriculum";
import type { LeakTag, Lesson, LessonStatus } from "@/domains/academy/types";
import type { Placement } from "@/domains/academy/placement";

/** Why this lesson is the one being recommended — shown to the player verbatim. */
export type RecommendationSource = "resume" | "review" | "leak" | "placement" | "next";

export interface Recommendation {
  lesson: Lesson;
  source: RecommendationSource;
  reason: string;
}

export interface RecommendationInput {
  statuses: Map<string, LessonStatus>;
  placement: Placement;
  /** Leaks the habit detector has confirmed over multiple weeks, most severe first. */
  detectedLeaks: LeakTag[];
}

const FINISHED: readonly LessonStatus[] = ["completed", "mastered"];

function isFinished(lesson: Lesson, statuses: Map<string, LessonStatus>): boolean {
  return FINISHED.includes(statuses.get(lessonId(lesson)) ?? "available");
}

const LEAK_LABEL: Record<LeakTag, string> = {
  low_cs: "your CS per minute",
  low_vision: "your vision score",
  high_deaths: "how often you are dying",
  objective_neglect: "how little you convert into objectives",
  late_game_throw: "how your late games are ending",
  tilt_prone: "how your games go after a loss",
};

/**
 * Picks the one lesson to put in front of the player. Order matters more than cleverness:
 * finish what you started, then fix what the data says is actually wrong, then follow the
 * curriculum. A recommendation the player cannot trace back to their own games is just a
 * table of contents.
 */
export function chooseNextLesson(input: RecommendationInput): Recommendation | null {
  const { statuses, placement, detectedLeaks } = input;

  // 1. Something already open.
  const open = allLessons().find((l) => statuses.get(lessonId(l)) === "in_progress");
  if (open) {
    return { lesson: open, source: "resume", reason: "You started this one and did not finish it." };
  }

  // 2. A mastery that came undone (ADR-027). It outranks a leak the detector raised because
  //    this one is a habit the player has already proved they can hold — and the wording says
  //    the measurement moved, never that they failed.
  const decayed = allLessons().find((l) => statuses.get(lessonId(l)) === "review");
  if (decayed) {
    return {
      lesson: decayed,
      source: "review",
      reason: "You had this one. Your last few games have gone back the other way.",
    };
  }

  // 3. A confirmed leak, then a leak the placement check raised. Confirmed ones come from
  //    several weeks of data, so they outrank a single 20-game snapshot.
  for (const leak of [...detectedLeaks, ...placement.leaks]) {
    const lesson = allLessons().find((l) => l.fixes.includes(leak) && !isFinished(l, statuses));
    if (lesson) {
      return {
        lesson,
        source: "leak",
        reason: `Your recent games flag ${LEAK_LABEL[leak]}. This lesson is the fix.`,
      };
    }
  }

  // 4. The next unfinished lesson in the track placement opened.
  const track = getTrack(placement.recommendedTrackId);
  const inTrack = track?.lessons.find((l) => !isFinished(l, statuses));
  if (inTrack) {
    return {
      lesson: inTrack,
      source: "placement",
      reason:
        placement.gamesAnalyzed > 0
          ? `Based on your last ${placement.gamesAnalyzed} games, this is where you are.`
          : "Start here — this is the beginning of the curriculum.",
    };
  }

  // 5. Anything left anywhere.
  const remaining = allLessons().find((l) => !isFinished(l, statuses));
  return remaining
    ? { lesson: remaining, source: "next", reason: "Next up in the curriculum." }
    : null;
}
