import { prisma } from "@/lib/db/prisma";
import { hasBooking, mayOpenQuestion } from "@/domains/marketplace/services/questionGate";

// Opening a coach ↔ student thread. Split from messagingService so the gate on
// who may start a conversation reads on its own, next to nothing else.

/** Which coach a student is opening a thread with — by id from the app, by slug from a profile. */
export type CoachRef = { id: string } | { slug: string };

export type OpenOutcome =
  | { ok: true; conversationId: string }
  | { ok: false; reason: "not-found" | "self" | "question-limit" };

/**
 * The student's thread with a coach, created on first use.
 *
 * A booking is no longer the ticket: a student may ask before booking, within
 * the limits in `questionGate.ts`. An existing thread always opens.
 */
export async function openThread(coach: CoachRef, studentId: string): Promise<OpenOutcome> {
  const profile = await prisma.coachProfile.findFirst({
    where: { ...("id" in coach ? { id: coach.id } : { slug: coach.slug }), status: "APPROVED" },
    select: { id: true, userId: true },
  });
  if (!profile) return { ok: false, reason: "not-found" };
  if (profile.userId === studentId) return { ok: false, reason: "self" };

  const pair = { coachProfileId: profile.id, studentId };
  const existing = await prisma.conversation.findUnique({
    where: { coachProfileId_studentId: pair },
    select: { id: true },
  });
  if (existing) return { ok: true, conversationId: existing.id };

  if (!(await hasBooking(profile.id, studentId)) && !(await mayOpenQuestion(studentId))) {
    return { ok: false, reason: "question-limit" };
  }

  const conversation = await prisma.conversation.upsert({
    where: { coachProfileId_studentId: pair },
    create: pair,
    update: {},
    select: { id: true },
  });

  return { ok: true, conversationId: conversation.id };
}
