import type { Position } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { CoachApplicationState } from "@/domains/marketplace/types";
import { MIN_REVIEWS_FOR_SCORE } from "@/domains/marketplace/policy";

// The coach's own profile, before and after approval.
//
// A profile is created lazily the first time someone opens the application
// form, and it starts in DRAFT — which is invisible to everyone but its owner.
// Nothing here decides whether a coach may sell; that is
// `coachApplicationService`, and keeping the two apart is what stops an edit
// endpoint from being able to approve anybody.

/** What a coach may set about themselves. Everything is editable after approval too. */
export interface CoachProfileInput {
  displayName: string;
  headline: string;
  bio: string;
  languages: string[];
  regions: string[];
  roles: Position[];
  championIds: number[];
  timezone: string;
}

export interface OwnCoachProfile extends CoachApplicationState {
  id: string;
  displayName: string;
  headline: string;
  bio: string;
  languages: string[];
  regions: string[];
  roles: Position[];
  championIds: number[];
  timezone: string;
  /** Basis points the platform keeps, snapshotted per profile — 2000 is 20%. */
  commissionBps: number;
  acceptingStudents: boolean;
  /** Null until enough reviews have been revealed for a score to mean anything. */
  rating: number | null;
  ratingCount: number;
  sessionsCompleted: number;
}

const OWN_PROFILE_SELECT = {
  id: true,
  status: true,
  slug: true,
  displayName: true,
  headline: true,
  bio: true,
  languages: true,
  regions: true,
  roles: true,
  championIds: true,
  timezone: true,
  commissionBps: true,
  acceptingStudents: true,
  ratingBayes: true,
  ratingCount: true,
  sessionsCompleted: true,
  submittedAt: true,
  reviewedAt: true,
  reviewNote: true,
} as const;

type OwnProfileRow = {
  submittedAt: Date | null;
  reviewedAt: Date | null;
  ratingBayes: number;
} & Omit<OwnCoachProfile, "submittedAt" | "reviewedAt" | "rating">;

function toOwnProfile(row: OwnProfileRow): OwnCoachProfile {
  const { ratingBayes, ...rest } = row;
  return {
    ...rest,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    reviewedAt: row.reviewedAt?.toISOString() ?? null,
    // Same threshold the public card uses: a 5.0 from one person is not a score.
    rating: row.ratingCount >= MIN_REVIEWS_FOR_SCORE ? ratingBayes : null,
  };
}

/** The signed-in user's coach profile, or null if they have never started one. */
export async function getOwnProfile(userId: string): Promise<OwnCoachProfile | null> {
  const row = await prisma.coachProfile.findUnique({
    where: { userId },
    select: OWN_PROFILE_SELECT,
  });
  return row ? toOwnProfile(row) : null;
}

/**
 * The caller's coach profile id whatever its status.
 *
 * What every coach-side write starts from, and deliberately not
 * `approvedCoachProfileId`: a coach may set their hours and build their
 * listings while an application is still in review, because the storefront
 * filters on status and nothing they prepare is visible until it passes.
 */
export async function ownCoachProfileId(userId: string): Promise<string | null> {
  const row = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return row?.id ?? null;
}

/**
 * Whether this user has a coach profile at all, whatever state it is in.
 *
 * What the section's nav keys off, rather than approval: an application sitting
 * in review is exactly when somebody needs to find their way back to it.
 */
export async function hasCoachProfile(userId: string): Promise<boolean> {
  const row = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { id: true },
  });
  return row !== null;
}

/** Whether this user is a coach anyone can currently book. */
export async function isApprovedCoach(userId: string): Promise<boolean> {
  const row = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { status: true },
  });
  return row?.status === "APPROVED";
}

/**
 * The caller's coach profile id, but only if they are approved.
 *
 * Every coach-side write starts here. Returning null rather than throwing lets
 * the caller decide between a 403 and a redirect to the application form, which
 * are different answers to "you are not a coach".
 */
export async function approvedCoachProfileId(userId: string): Promise<string | null> {
  const row = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { id: true, status: true },
  });
  return row?.status === "APPROVED" ? row.id : null;
}

export type SaveOutcome = { ok: true; profile: OwnCoachProfile } | { ok: false; reason: "locked" };

/**
 * Create or update the caller's own profile.
 *
 * Refused while an application is PENDING: a profile that can be edited under a
 * reviewer is one where what gets approved is not what was read. REJECTED is
 * editable on purpose — reapplying is the point of being told why.
 */
export async function saveOwnProfile(
  userId: string,
  input: CoachProfileInput
): Promise<SaveOutcome> {
  const existing = await prisma.coachProfile.findUnique({
    where: { userId },
    select: { status: true },
  });

  if (existing?.status === "PENDING" || existing?.status === "SUSPENDED") {
    return { ok: false, reason: "locked" };
  }

  const row = await prisma.coachProfile.upsert({
    where: { userId },
    create: { userId, ...input },
    update: input,
    select: OWN_PROFILE_SELECT,
  });

  return { ok: true, profile: toOwnProfile(row) };
}

/**
 * The coach's own holiday switch.
 *
 * Deliberately not `status`: a coach stepping away for a fortnight has not been
 * taken down, and collapsing the two would lose the reason and the way back.
 */
export async function setAcceptingStudents(userId: string, accepting: boolean): Promise<boolean> {
  const { count } = await prisma.coachProfile.updateMany({
    where: { userId, status: "APPROVED" },
    data: { acceptingStudents: accepting },
  });
  return count > 0;
}
