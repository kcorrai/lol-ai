import { prisma } from "@/lib/db/prisma";

// Asking a coach something before booking them.
//
// Every tutoring marketplace that converts lets a student ask first — nobody
// hands a stranger money without a question. The risk is the one the booking
// gate was guarding: an open inbox fills with people arranging to pay each
// other somewhere else, and with spam. So a pre-booking thread is allowed, but
// narrow: a few new ones a day, and a couple of messages until the coach
// answers. Contact details are stripped from every message either way.

/** New question threads a student may open in a day, across all coaches. */
export const MAX_QUESTION_THREADS_PER_DAY = 5;

/** Messages a student may send before the coach has replied, while they have no booking. */
export const MAX_UNANSWERED_QUESTIONS = 2;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whether this student and coach have ever had a booking, in any state. */
export async function hasBooking(coachProfileId: string, studentId: string): Promise<boolean> {
  const booking = await prisma.booking.findFirst({
    where: { coachProfileId, studentId },
    select: { id: true },
  });
  return booking !== null;
}

/** Whether the student may open one more question thread today. */
export async function mayOpenQuestion(studentId: string, now = new Date()): Promise<boolean> {
  const opened = await prisma.conversation.count({
    where: {
      studentId,
      createdAt: { gte: new Date(now.getTime() - DAY_MS) },
      // Threads with a booking behind them are not questions and do not count.
      coachProfile: { bookings: { none: { studentId } } },
    },
  });
  return opened < MAX_QUESTION_THREADS_PER_DAY;
}

/**
 * Whether a student without a booking may send another message in this thread.
 *
 * Counts what they have sent since the coach last wrote; a reply resets it,
 * because at that point it is a conversation rather than a queue of asks.
 */
export async function mayAskAgain(conversationId: string, studentId: string): Promise<boolean> {
  const lastReply = await prisma.message.findFirst({
    where: { conversationId, senderId: { not: studentId } },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  const unanswered = await prisma.message.count({
    where: {
      conversationId,
      senderId: studentId,
      ...(lastReply ? { createdAt: { gt: lastReply.createdAt } } : {}),
    },
  });

  return unanswered < MAX_UNANSWERED_QUESTIONS;
}
