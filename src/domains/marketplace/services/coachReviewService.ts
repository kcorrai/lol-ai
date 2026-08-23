import type { CoachStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit/auditService";
import { logger } from "@/lib/utils/logger";
import { pickSlug, slugify } from "@/domains/marketplace/slug";

// Who may sell on this platform, and the record of why.
//
// This is the gate the marketplace's credibility rests on, so every function
// here writes to `audit_logs` naming the admin who decided. "Why is this coach
// listed" has to be answerable later by somebody who was not in the room —
// which is exactly what no competitor can do, and exactly what turns up in
// their reviews when a refund is refused.

export interface ApplicationRow {
  id: string;
  userId: string;
  displayName: string;
  headline: string;
  bio: string;
  languages: string[];
  regions: string[];
  roles: string[];
  submittedAt: string | null;
  /** The account's email, so a reviewer can recognise a repeat applicant. */
  email: string | null;
  /** Ranks we have read for this coach, which is the substance of the review. */
  rankProofs: {
    method: string;
    queueType: string;
    tier: string;
    division: string;
    checkedAt: string;
  }[];
}

/** A review queue, oldest first — nobody works a queue from the back. */
export async function listApplications(status: CoachStatus = "PENDING"): Promise<ApplicationRow[]> {
  const rows = await prisma.coachProfile.findMany({
    where: { status },
    orderBy: { submittedAt: "asc" },
    select: {
      id: true,
      userId: true,
      displayName: true,
      headline: true,
      bio: true,
      languages: true,
      regions: true,
      roles: true,
      submittedAt: true,
      user: { select: { email: true } },
      rankProofs: {
        select: { method: true, queueType: true, tier: true, division: true, checkedAt: true },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    displayName: row.displayName,
    headline: row.headline,
    bio: row.bio,
    languages: row.languages,
    regions: row.regions,
    roles: row.roles,
    submittedAt: row.submittedAt?.toISOString() ?? null,
    email: row.user.email,
    rankProofs: row.rankProofs.map((proof) => ({
      method: proof.method,
      queueType: proof.queueType,
      tier: proof.tier,
      division: proof.division,
      checkedAt: proof.checkedAt.toISOString(),
    })),
  }));
}

/** How many are waiting, for the admin nav badge. */
export async function pendingCount(): Promise<number> {
  return prisma.coachProfile.count({ where: { status: "PENDING" } });
}

export type DecisionOutcome =
  | { ok: true; slug: string | null }
  | { ok: false; reason: "not-found" | "wrong-status" };

/**
 * Approve an application and put it on `/coaches`.
 *
 * The slug is assigned here and nowhere else — at approval rather than at
 * signup, so a rejected application never burns a name and nobody reserves an
 * impersonating URL just by filling in a form. A coach approved once keeps the
 * slug they already had: a URL that has been public is theirs.
 */
export async function approveApplication(
  coachProfileId: string,
  adminId: string
): Promise<DecisionOutcome> {
  const profile = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    select: { id: true, userId: true, status: true, slug: true, displayName: true },
  });

  if (!profile) return { ok: false, reason: "not-found" };
  if (profile.status !== "PENDING") return { ok: false, reason: "wrong-status" };

  const slug = profile.slug ?? (await allocateSlug(profile.displayName));
  const now = new Date();

  await prisma.coachProfile.update({
    where: { id: profile.id },
    data: {
      status: "APPROVED",
      slug,
      reviewedById: adminId,
      reviewedAt: now,
      reviewNote: null,
      publishedAt: profile.slug ? undefined : now,
    },
  });

  await audit({
    userId: profile.userId,
    actorId: adminId,
    action: "coach.application.approved",
    resourceId: profile.id,
    metadata: { slug },
  });

  logger.info("[marketplace] coach approved", { coachProfileId: profile.id, slug });
  return { ok: true, slug };
}

/**
 * Reject an application, with the reason attached.
 *
 * The note is not optional anywhere up the call chain. Being told nothing is
 * the complaint every rejected applicant on every one of these platforms has,
 * and it is also the only thing that makes a second application worth reading.
 */
export async function rejectApplication(
  coachProfileId: string,
  adminId: string,
  note: string
): Promise<DecisionOutcome> {
  return decide(
    coachProfileId,
    adminId,
    note,
    "REJECTED",
    ["PENDING"],
    "coach.application.rejected"
  );
}

/** Take a live coach down. Bookings already made still run their course. */
export async function suspendCoach(
  coachProfileId: string,
  adminId: string,
  note: string
): Promise<DecisionOutcome> {
  return decide(coachProfileId, adminId, note, "SUSPENDED", ["APPROVED"], "coach.suspended");
}

/** Put a suspended coach back on the storefront. */
export async function reinstateCoach(
  coachProfileId: string,
  adminId: string,
  note: string
): Promise<DecisionOutcome> {
  return decide(coachProfileId, adminId, note, "APPROVED", ["SUSPENDED"], "coach.reinstated");
}

type DecisionAction = "coach.application.rejected" | "coach.suspended" | "coach.reinstated";

async function decide(
  coachProfileId: string,
  adminId: string,
  note: string,
  next: CoachStatus,
  allowedFrom: CoachStatus[],
  action: DecisionAction
): Promise<DecisionOutcome> {
  const profile = await prisma.coachProfile.findUnique({
    where: { id: coachProfileId },
    select: { id: true, userId: true, status: true, slug: true },
  });

  if (!profile) return { ok: false, reason: "not-found" };
  if (!allowedFrom.includes(profile.status)) return { ok: false, reason: "wrong-status" };

  await prisma.coachProfile.update({
    where: { id: profile.id },
    data: { status: next, reviewedById: adminId, reviewedAt: new Date(), reviewNote: note },
  });

  await audit({
    userId: profile.userId,
    actorId: adminId,
    action,
    resourceId: profile.id,
    metadata: { note },
  });

  logger.info("[marketplace] coach decision", { coachProfileId: profile.id, action });
  return { ok: true, slug: profile.slug };
}

/**
 * Find a free slug for a display name.
 *
 * Only slugs starting with this name's base can collide with it or with any of
 * its `-2`, `-3` suffixes, so that prefix is the whole candidate set and this
 * stays cheap as the marketplace grows.
 */
async function allocateSlug(displayName: string): Promise<string> {
  const base = slugify(displayName) || "coach";
  const rows = await prisma.coachProfile.findMany({
    where: { slug: { startsWith: base } },
    select: { slug: true },
  });

  const taken = new Set(
    rows.map((row) => row.slug).filter((slug): slug is string => slug !== null)
  );
  return pickSlug(displayName, taken);
}
