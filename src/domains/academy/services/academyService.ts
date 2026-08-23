import { getActiveHabits, getPlayerPerformanceProfile } from "@/domains/analysis";
import { listAccounts } from "@/domains/riot";
import { DEFAULT_PLACEMENT, placeFromProfile, type Placement } from "@/domains/academy/placement";
import { chooseNextLesson, type Recommendation } from "@/domains/academy/recommendation";
import { getLessonStatuses } from "@/domains/academy/services/progressService";
import {
  getActiveAssignments,
  type AssignmentView,
} from "@/domains/academy/services/assignmentService";
import { primaryPositionForAccount } from "@/domains/academy/services/assignmentReadings";
import { roleFromPosition } from "@/domains/academy/roles";
import type { LeakTag, LessonStatus, RoleId } from "@/domains/academy/types";

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
  /** The role the player actually queues, which decides whose role path is theirs. */
  role: RoleId | null;
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
        role: null,
      }),
      assignments: [],
      personalised: false,
      role: null,
    };
  }

  const [statuses, assignments, riotAccountId] = await Promise.all([
    getLessonStatuses(userId),
    getActiveAssignments(userId),
    primaryRiotAccountId(userId),
  ]);

  const { placement, detectedLeaks, personalised, role } = await personalise(riotAccountId);

  return {
    statuses,
    placement,
    recommendation: chooseNextLesson({ statuses, placement, detectedLeaks, role }),
    assignments,
    personalised,
    role,
  };
}

/**
 * Just the role, for surfaces that need to know whose path is whose and nothing else. The hub
 * gets it from `getAcademyOverview`; this spares the role-paths page a placement it never renders.
 */
export async function getPlayerRole(userId: string | null): Promise<RoleId | null> {
  if (!userId) return null;
  const riotAccountId = await primaryRiotAccountId(userId);
  if (!riotAccountId) return null;
  return roleFromPosition(await primaryPositionForAccount(riotAccountId).catch(() => null));
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
  role: RoleId | null;
}

async function personalise(riotAccountId: string | null): Promise<Personalisation> {
  if (!riotAccountId) {
    return { placement: DEFAULT_PLACEMENT, detectedLeaks: [], personalised: false, role: null };
  }

  // A linked account with no synced matches throws from the profile builder. That is a
  // normal state on day one, not an error — fall back to the default placement.
  // The role is read off ranked games only, so it can be known for a player whose profile
  // is too thin to place — and unknown for one whose profile is fine but who has never
  // queued ranked. The two are independent, which is why neither falls back to the other.
  const [profile, habits, position] = await Promise.all([
    getPlayerPerformanceProfile(riotAccountId, 20).catch(() => null),
    getActiveHabits(riotAccountId).catch(() => []),
    primaryPositionForAccount(riotAccountId).catch(() => null),
  ]);

  const detectedLeaks = habits
    .filter((h) => TEACHABLE.includes(h.habitType))
    .map((h) => h.habitType as LeakTag);

  return {
    placement: profile ? placeFromProfile(profile) : DEFAULT_PLACEMENT,
    detectedLeaks,
    personalised: profile !== null,
    role: roleFromPosition(position),
  };
}
