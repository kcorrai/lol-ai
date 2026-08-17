import { prisma } from "@/lib/db/prisma";
import { withUserLock } from "@/lib/db/userLock";
import { logger } from "@/lib/utils/logger";
import {
  DEFAULT_CANCELLATION_HOURS,
  isScheduled,
  respondByFrom,
  splitPrice,
} from "@/domains/marketplace/policy";
import { isSlotFree } from "@/domains/marketplace/services/slotService";
import { recordCreation } from "@/domains/marketplace/services/bookingEventService";

// Creating a booking. Moving one afterwards is `bookingLifecycleService`.

export interface BookingRequest {
  studentId: string;
  listingId: string;
  /** Required for the scheduled kinds, refused for the async one. */
  startTime?: Date | null;
  studentGoal: string;
  studentTimezone: string;
  /** The account under review, which need not be the student's primary one. */
  riotAccountId?: string | null;
  matchIds?: string[];
  vodUrl?: string | null;
}

export type CreateOutcome =
  | { ok: true; bookingId: string }
  | {
      ok: false;
      reason:
        | "listing-not-found"
        | "not-accepting"
        | "self-booking"
        | "slot-required"
        | "slot-taken"
        | "material-required"
        | "account-not-owned";
    };

/**
 * Request a session.
 *
 * The whole thing runs under an advisory lock on the coach, because the check
 * that a slot is free and the write that takes it are two statements: without
 * the lock, two students both read "free" and both insert, and the coach wakes
 * up double-booked with no way to tell which request was first.
 */
export async function createBooking(request: BookingRequest): Promise<CreateOutcome> {
  const listing = await prisma.coachListing.findFirst({
    where: { id: request.listingId, isActive: true },
    select: {
      id: true,
      kind: true,
      durationMinutes: true,
      priceCents: true,
      currency: true,
      coachProfileId: true,
      coachProfile: {
        select: {
          id: true,
          userId: true,
          status: true,
          acceptingStudents: true,
          commissionBps: true,
          timezone: true,
        },
      },
    },
  });

  if (!listing || listing.coachProfile.status !== "APPROVED") {
    return { ok: false, reason: "listing-not-found" };
  }
  if (!listing.coachProfile.acceptingStudents) return { ok: false, reason: "not-accepting" };

  // A coach booking themselves would settle money in a circle and pollute their
  // own review count.
  if (listing.coachProfile.userId === request.studentId) {
    return { ok: false, reason: "self-booking" };
  }

  const scheduled = isScheduled(listing.kind);
  if (scheduled && !request.startTime) return { ok: false, reason: "slot-required" };

  // An async review with nothing to review is a session the coach cannot start.
  if (!scheduled && (request.matchIds ?? []).length === 0 && !request.vodUrl) {
    return { ok: false, reason: "material-required" };
  }

  if (request.riotAccountId) {
    const owned = await prisma.riotAccount.findFirst({
      where: { id: request.riotAccountId, userId: request.studentId },
      select: { id: true },
    });
    if (!owned) return { ok: false, reason: "account-not-owned" };
  }

  const now = new Date();
  const { platformFeeCents, coachEarningsCents } = splitPrice(
    listing.priceCents,
    listing.coachProfile.commissionBps
  );

  const endTime = request.startTime
    ? new Date(request.startTime.getTime() + listing.durationMinutes * 60_000)
    : null;

  const created = await withUserLock(`coach:${listing.coachProfileId}`, async (tx) => {
    if (scheduled && request.startTime) {
      const free = await isSlotFree(
        listing.coachProfileId,
        request.startTime,
        listing.durationMinutes,
        now
      );
      if (!free) return null;
    }

    const booking = await tx.booking.create({
      data: {
        studentId: request.studentId,
        coachProfileId: listing.coachProfileId,
        listingId: listing.id,
        kind: listing.kind,
        status: "PENDING_COACH",
        startTime: request.startTime ?? null,
        endTime,
        studentTimezone: request.studentTimezone,
        coachTimezone: listing.coachProfile.timezone,
        // Snapshotted, never joined for. A coach raising their rate, or a change
        // to the platform's cut, must not rewrite what this session was worth.
        priceCents: listing.priceCents,
        currency: listing.currency,
        commissionBps: listing.coachProfile.commissionBps,
        platformFeeCents,
        coachEarningsCents,
        riotAccountId: request.riotAccountId ?? null,
        matchIds: request.matchIds ?? [],
        vodUrl: request.vodUrl ?? null,
        studentGoal: request.studentGoal,
        respondByAt: respondByFrom(now),
        cancellationHours: DEFAULT_CANCELLATION_HOURS,
      },
      select: { id: true },
    });

    await recordCreation(booking.id, request.studentId, tx);
    return booking;
  });

  if (!created) return { ok: false, reason: "slot-taken" };

  logger.info("[marketplace] booking requested", {
    bookingId: created.id,
    coachProfileId: listing.coachProfileId,
    kind: listing.kind,
  });

  return { ok: true, bookingId: created.id };
}
