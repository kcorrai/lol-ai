import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

// Telling people what happened.
//
// The `Notification` table has existed since the initial schema and nothing has
// ever written to it — the app's notifications have all been email. This
// section needs both: a booking request is worth an email because a coach may
// not be on the site, and it is worth a row because they will be on the site
// later and need to find it.
//
// Nothing here throws into a caller. A notification failing must not roll back
// the booking it was about.

export type MarketplaceNotification =
  | { type: "booking.requested"; bookingId: string; coachUserId: string; studentName: string }
  | { type: "booking.accepted"; bookingId: string; studentId: string; coachName: string }
  | {
      type: "booking.declined";
      bookingId: string;
      studentId: string;
      coachName: string;
      reason: string;
    }
  | { type: "booking.expired"; bookingId: string; studentId: string; coachName: string }
  | { type: "booking.delivered"; bookingId: string; studentId: string; coachName: string }
  | {
      type: "session.reminder";
      bookingId: string;
      userId: string;
      withName: string;
      startsAt: Date;
    }
  | { type: "dispute.resolved"; bookingId: string; userId: string; refunded: boolean };

interface Composed {
  userId: string;
  title: string;
  body: string;
  actionUrl: string;
}

/** What each event says, and to whom. Kept together so the wording can be read as a set. */
function compose(event: MarketplaceNotification): Composed {
  const url = `/sessions/${event.bookingId}`;

  switch (event.type) {
    case "booking.requested":
      return {
        userId: event.coachUserId,
        title: "New session request",
        body: `${event.studentName} has asked you for a session. You have 48 hours to accept or decline.`,
        actionUrl: url,
      };
    case "booking.accepted":
      return {
        userId: event.studentId,
        title: "Your session is confirmed",
        body: `${event.coachName} accepted your request.`,
        actionUrl: url,
      };
    case "booking.declined":
      return {
        userId: event.studentId,
        title: "Your request was declined",
        // The reason travels with it. Being told nothing is the complaint.
        body: `${event.coachName} declined: ${event.reason}`,
        actionUrl: url,
      };
    case "booking.expired":
      return {
        userId: event.studentId,
        title: "Your request expired",
        body: `${event.coachName} did not answer in time, so nothing was charged. Try another coach.`,
        actionUrl: "/coaches",
      };
    case "booking.delivered":
      return {
        userId: event.studentId,
        title: "Your session was delivered",
        body: "Have a look. If something is not right, say so before the window closes.",
        actionUrl: url,
      };
    case "session.reminder":
      return {
        userId: event.userId,
        title: "Your session starts in an hour",
        body: `With ${event.withName}. Check the meeting link before it starts.`,
        actionUrl: url,
      };
    case "dispute.resolved":
      return {
        userId: event.userId,
        title: event.refunded ? "Your session was refunded" : "Your session was settled",
        body: "We have decided on the session you raised. The reasoning is on the session page.",
        actionUrl: url,
      };
  }
}

/**
 * Record one notification.
 *
 * Swallows its own failures on purpose: a notification that cannot be written
 * must not take down the booking it was about.
 */
export async function notify(event: MarketplaceNotification): Promise<void> {
  try {
    const composed = compose(event);
    await prisma.notification.create({
      data: {
        userId: composed.userId,
        type: event.type,
        title: composed.title,
        body: composed.body,
        actionUrl: composed.actionUrl,
      },
    });
  } catch (error) {
    logger.error("[marketplace] could not write a notification", { type: event.type, error });
  }
}

export interface NotificationView {
  id: string;
  type: string;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

/** The caller's notifications, newest first. */
export async function listNotifications(
  userId: string,
  limit = 30
): Promise<{ notifications: NotificationView[]; unread: number }> {
  const [rows, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        actionUrl: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications: rows.map((row) => ({
      ...row,
      createdAt: row.createdAt.toISOString(),
    })),
    unread,
  };
}

/** Mark everything read. */
export async function markNotificationsRead(userId: string): Promise<number> {
  const { count } = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
  return count;
}
