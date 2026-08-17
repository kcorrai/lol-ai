import { getActiveHabits, getPlayerPerformanceProfile } from "@/domains/analysis";
import { listAccounts } from "@/domains/riot";
import { DEFAULT_PLACEMENT, placeFromProfile, type Placement } from "@/domains/academy/placement";
import { chooseNextLesson, type Recommendation } from "@/domains/academy/recommendation";
import { getLessonStatuses } from "@/domains/academy/services/progressService";
import { getActiveAssignments, type AssignmentView } from "@/domains/academy/services/assignmentService";
import type { LeakTag, LessonStatus } from "@/domains/academy/types";

/** Habit types the habit detector raises that the curriculum knows how to teach to. */
const TEACHABLE: readonly string[] = [
  "low_cs",
  "low_vision",
  "high_deaths",
  "objective_neglect",
  "late_game_throw",
  "tilt_prone",
];

export interface AcademyOverview {
  statuses: Map<string, LessonStatus>;
  placement: Placement;
  recommendation: Recommendation | null;
  /** Field assignments still being judged against the player's matches. */
  assignments: AssignmentView[];
  /** False when there is nothing to personalise from — no account, or no synced matches. */
  personalised: boolean;
}

/**
 * Everything the hub needs about one player. Every personalised input is optional:
 * a signed-out visitor, an account with no matches and a fully synced account all
 * render the same page, only with progressively better reasons attached.
 */
export async function getAcademyOverview(userId: string | null): Promise<AcademyOverview> {
  if (!userId) {
    return {
      statuses: new Map(),
      placement: DEFAULT_PLACEMENT,
      recommendation: chooseNextLesson({
        statuses: new Map(),
        placement: DEFAULT_PLACEMENT,
        detectedLeaks: [],
      }),
      assignments: [],
      personalised: false,
    };
  }

  const [statuses, assignments, riotAccountId] = await Promise.all([
    getLessonStatuses(userId),
    getActiveAssignments(userId),
    primaryRiotAccountId(userId),
  ]);

  const { placement, detectedLeaks, personalised } = await personalise(riotAccountId);

  return {
    statuses,
    placement,
    recommendation: chooseNextLesson({ statuses, placement, detectedLeaks }),
    assignments,
    personalised,
  };
}

async function primaryRiotAccountId(userId: string): Promise<string | null> {
  const accounts = await listAccounts(userId);
  if (accounts.length === 0) return null;
  return (accounts.find((a) => a.isPrimary) ?? accounts[0]).id;
}

interface Personalisation {
  placement: Placement;
  detectedLeaks: LeakTag[];
  personalised: boolean;
}

async function personalise(riotAccountId: string | null): Promise<Personalisation> {
  if (!riotAccountId) {
    return { placement: DEFAULT_PLACEMENT, detectedLeaks: [], personalised: false };
  }

  // A linked account with no synced matches throws from the profile builder. That is a
  // normal state on day one, not an error — fall back to the default placement.
  const [profile, habits] = await Promise.all([
    getPlayerPerformanceProfile(riotAccountId, 20).catch(() => null),
    getActiveHabits(riotAccountId).catch(() => []),
  ]);

  const detectedLeaks = habits
    .filter((h) => TEACHABLE.includes(h.habitType))
    .map((h) => h.habitType as LeakTag);

  return {
    placement: profile ? placeFromProfile(profile) : DEFAULT_PLACEMENT,
    detectedLeaks,
    personalised: profile !== null,
  };
}
