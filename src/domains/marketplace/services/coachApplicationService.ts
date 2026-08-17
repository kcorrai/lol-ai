import { prisma } from "@/lib/db/prisma";
import { audit } from "@/lib/audit/auditService";

// The applicant's side of the gate: submitting a profile for review.
//
// Deliberately holds nothing that can approve anybody — that is
// `coachReviewService`, and an endpoint reachable by an applicant must not be
// able to reach a decision.

/** The minimum a profile must carry before a reviewer is asked to look at it. */
export const MIN_BIO_LENGTH = 120;

export type SubmitOutcome =
  | { ok: true }
  | { ok: false; reason: "no-profile" | "already-submitted" | "suspended" | "incomplete"; detail?: string };

/**
 * Move a DRAFT profile into review.
 *
 * The completeness checks live here rather than in a Zod schema on the route
 * because they are a product rule about what is worth a reviewer's time, not a
 * question of whether the request parsed. REJECTED can be resubmitted: being
 * told why is only useful if there is a way back.
 */
export async function submitApplication(userId: string): Promise<SubmitOutcome> {
  const profile = await prisma.coachProfile.findUnique({
    where: { userId },
    select: {
      id: true,
      status: true,
      displayName: true,
      headline: true,
      bio: true,
      languages: true,
      regions: true,
      roles: true,
    },
  });

  if (!profile) return { ok: false, reason: "no-profile" };
  if (profile.status === "PENDING" || profile.status === "APPROVED") {
    return { ok: false, reason: "already-submitted" };
  }
  if (profile.status === "SUSPENDED") return { ok: false, reason: "suspended" };

  const missing = firstMissingField(profile);
  if (missing) return { ok: false, reason: "incomplete", detail: missing };

  await prisma.coachProfile.update({
    where: { id: profile.id },
    // The previous decision is cleared, so a resubmitted application never
    // shows a reviewer a note from the last round as if it were this one's.
    data: { status: "PENDING", submittedAt: new Date(), reviewNote: null, reviewedAt: null },
  });

  await audit({
    userId,
    action: "coach.application.submitted",
    resourceId: profile.id,
    metadata: { displayName: profile.displayName },
  });

  return { ok: true };
}

/** The first thing missing from a profile, phrased for the applicant. Null when complete. */
export function firstMissingField(profile: {
  displayName: string;
  headline: string;
  bio: string;
  languages: string[];
  regions: string[];
  roles: string[];
}): string | null {
  if (!profile.displayName.trim()) return "Add a display name.";
  if (!profile.headline.trim()) return "Add a headline.";
  if (profile.bio.trim().length < MIN_BIO_LENGTH) {
    return `Write at least ${MIN_BIO_LENGTH} characters about how you coach.`;
  }
  if (profile.languages.length === 0) return "Add at least one language you coach in.";
  if (profile.regions.length === 0) return "Add at least one region you play on.";
  if (profile.roles.length === 0) return "Add at least one role you coach.";
  return null;
}

/** Pull an application back out of review while nobody has decided on it yet. */
export async function withdrawApplication(userId: string): Promise<boolean> {
  const { count } = await prisma.coachProfile.updateMany({
    where: { userId, status: "PENDING" },
    data: { status: "DRAFT", submittedAt: null },
  });
  return count > 0;
}
