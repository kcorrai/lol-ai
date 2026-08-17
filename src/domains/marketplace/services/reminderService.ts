import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { notify } from "@/domains/marketplace/services/notificationService";

// "Your session starts in an hour."
//
// A per-booking timer is the obvious shape and the wrong one here: Vercel caps
// a project at 100 cron jobs, and Vercel Queues' delay tops out at seven days,
// which a session booked three weeks out would blow straight through. So this
// is a sweep over a window instead — the standard shape for exactly this
// problem, and it needs no scheduler that knows about individual bookings.
//
// `reminderSentAt` is what makes it safe to run every few minutes: a booking
// that has been reminded is never picked up again, so overlapping runs cannot
// send twice.

/** How long before the session the reminder goes out. */
const LEAD_MINUTES = 60;

/** How wide the window is. Comfortably more than the sweep interval, so nothing falls through. */
const WINDOW_MINUTES = 15;

/**
 * Remind both sides about sessions starting soon.
 *
 * Both, not just the student: a coach with a full week is exactly the person
 * who loses track of one, and a coach who does not turn up is the failure this
 * marketplace can least afford.
 */
export async function sendSessionReminders(now = new Date(), limit = 200): Promise<number> {
  const from = new Date(now.getTime() + (LEAD_MINUTES - WINDOW_MINUTES) * 60_000);
  const to = new Date(now.getTime() + LEAD_MINUTES * 60_000);

  const due = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startTime: { gte: from, lte: to },
    },
    orderBy: { startTime: "asc" },
    take: limit,
    select: {
      id: true,
      startTime: true,
      studentId: true,
      student: { select: { name: true } },
      coachProfile: { select: { userId: true, displayName: true } },
    },
  });

  let sent = 0;

  for (const booking of due) {
    if (!booking.startTime) continue;

    // Stamped first. If the notifications fail, a missed reminder is a much
    // smaller problem than a loop that sends one every five minutes until the
    // session starts.
    const { count } = await prisma.booking.updateMany({
      where: { id: booking.id, reminderSentAt: null },
      data: { reminderSentAt: now },
    });
    if (count === 0) continue;

    await notify({
      type: "session.reminder",
      bookingId: booking.id,
      userId: booking.studentId,
      withName: booking.coachProfile.displayName,
      startsAt: booking.startTime,
    });

    await notify({
      type: "session.reminder",
      bookingId: booking.id,
      userId: booking.coachProfile.userId,
      withName: booking.student.name ?? "your student",
      startsAt: booking.startTime,
    });

    sent += 1;
  }

  if (sent > 0) logger.info("[marketplace] session reminders sent", { sent });
  return sent;
}
