import type { BookingStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { notify } from "@/domains/marketplace/services/notificationService";

// Which moves are worth telling somebody about.
//
// Deliberately not all of them. A student cancelling their own booking does not
// need a notification saying they cancelled it, and a coach who just pressed
// "accept" does not need to be told they accepted. The ones here are the moves
// somebody finds out about from us or not at all.

const WORTH_TELLING: readonly BookingStatus[] = ["CONFIRMED", "DECLINED", "EXPIRED", "DELIVERED"];

/** Tell whoever was not the one who acted. Swallows its own failures. */
export async function notifyForMove(
  bookingId: string,
  to: BookingStatus,
  reason: string | null
): Promise<void> {
  if (!WORTH_TELLING.includes(to)) return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      studentId: true,
      coachProfile: { select: { displayName: true } },
    },
  });
  if (!booking) return;

  const coachName = booking.coachProfile.displayName;

  switch (to) {
    case "CONFIRMED":
      return notify({
        type: "booking.accepted",
        bookingId,
        studentId: booking.studentId,
        coachName,
      });
    case "DECLINED":
      return notify({
        type: "booking.declined",
        bookingId,
        studentId: booking.studentId,
        coachName,
        reason: reason ?? "No reason given.",
      });
    case "EXPIRED":
      return notify({
        type: "booking.expired",
        bookingId,
        studentId: booking.studentId,
        coachName,
      });
    case "DELIVERED":
      return notify({
        type: "booking.delivered",
        bookingId,
        studentId: booking.studentId,
        coachName,
      });
  }
}
