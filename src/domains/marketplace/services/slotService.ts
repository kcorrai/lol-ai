import { prisma } from "@/lib/db/prisma";
import { computeFreeSlots } from "@/domains/marketplace/slots";
import type { Interval } from "@/domains/marketplace/intervals";
import { getAvailability } from "@/domains/marketplace/services/availabilityService";
import type { Slot } from "@/domains/marketplace/types";

// What a student can actually book, for one listing.
//
// Everything here is derived. Nothing is stored: a cached slot list goes stale
// the moment anyone books, and serving a slot that has just gone is how two
// students end up holding the same hour.

/** How far ahead slots are offered at all. */
const HORIZON_DAYS = 30;

/** How far apart slot starts are offered. */
const SLOT_INTERVAL_MINUTES = 30;

/** How soon from now a session may start. */
const MINIMUM_NOTICE_MINUTES = 120;

/** Statuses that still hold a coach's time. A declined request does not. */
const BLOCKING_STATUSES = ["PENDING_COACH", "CONFIRMED"] as const;

export interface SlotQuery {
  coachProfileId: string;
  durationMinutes: number;
  from?: Date;
  to?: Date;
  now?: Date;
}

/**
 * Free slots for a coach, for a session of a given length.
 *
 * A pending request blocks the same time a confirmed one does. It has to: the
 * coach has 48 hours to answer it, and offering that hour to somebody else
 * meanwhile is a double booking waiting for the coach to accept both.
 */
export async function freeSlots(query: SlotQuery): Promise<Slot[]> {
  const now = query.now ?? new Date();
  const from = query.from ?? now;
  const to = query.to ?? new Date(now.getTime() + HORIZON_DAYS * 86_400_000);

  const [availability, busy] = await Promise.all([
    getAvailability(query.coachProfileId),
    busyIntervals(query.coachProfileId, from, to),
  ]);

  const slots = computeFreeSlots({
    rules: availability.rules,
    exceptions: availability.exceptions,
    busy,
    timeZone: availability.timeZone,
    from,
    to,
    durationMinutes: query.durationMinutes,
    slotIntervalMinutes: SLOT_INTERVAL_MINUTES,
    minimumNoticeMinutes: MINIMUM_NOTICE_MINUTES,
    now,
  });

  return slots.map((slot) => ({
    start: slot.start.toISOString(),
    end: slot.end.toISOString(),
  }));
}

/** Bookings that still hold time in the window. */
async function busyIntervals(
  coachProfileId: string,
  from: Date,
  to: Date
): Promise<Interval[]> {
  const rows = await prisma.booking.findMany({
    where: {
      coachProfileId,
      status: { in: [...BLOCKING_STATUSES] },
      startTime: { not: null, lt: to },
      endTime: { gt: from },
    },
    select: { startTime: true, endTime: true },
  });

  return rows
    .filter((row): row is { startTime: Date; endTime: Date } =>
      row.startTime !== null && row.endTime !== null
    )
    .map((row) => ({ start: row.startTime, end: row.endTime }));
}

/**
 * Whether one exact slot is still free.
 *
 * Called at booking time rather than trusted from the page the student is
 * looking at, which may have been open for an hour. This is the check; the
 * unique constraint the booking write relies on is the guarantee.
 */
export async function isSlotFree(
  coachProfileId: string,
  start: Date,
  durationMinutes: number,
  now = new Date()
): Promise<boolean> {
  const end = new Date(start.getTime() + durationMinutes * 60_000);

  const slots = await freeSlots({
    coachProfileId,
    durationMinutes,
    // A window of exactly this slot, widened by a minute so the search cannot
    // miss it on a boundary.
    from: new Date(start.getTime() - 60_000),
    to: new Date(end.getTime() + 60_000),
    now,
  });

  return slots.some((slot) => new Date(slot.start).getTime() === start.getTime());
}

/**
 * Free slots for one listing, addressed the way the public page addresses it.
 *
 * The listing decides the length, so the caller never gets to say how long a
 * session is — a request cannot ask for a 15-minute slot on a 60-minute
 * product. Returns null when the coach or the listing is not publicly there.
 */
export async function coachSlotsBySlug(
  slug: string,
  listingId: string,
  days?: number
): Promise<{ slots: Slot[]; timeZone: string; durationMinutes: number } | null> {
  const listing = await prisma.coachListing.findFirst({
    where: {
      id: listingId,
      isActive: true,
      coachProfile: { slug, status: "APPROVED" },
    },
    select: {
      durationMinutes: true,
      kind: true,
      coachProfileId: true,
      coachProfile: { select: { timezone: true } },
    },
  });

  if (!listing) return null;

  // An async review has no calendar at all — it runs against a deadline, so an
  // empty slot list here is the correct answer rather than a missing one.
  if (listing.kind === "VOD_REVIEW") {
    return {
      slots: [],
      timeZone: listing.coachProfile.timezone,
      durationMinutes: listing.durationMinutes,
    };
  }

  const now = new Date();
  const horizon = Math.min(days ?? HORIZON_DAYS, 60);

  return {
    slots: await freeSlots({
      coachProfileId: listing.coachProfileId,
      durationMinutes: listing.durationMinutes,
      from: now,
      to: new Date(now.getTime() + horizon * 86_400_000),
      now,
    }),
    timeZone: listing.coachProfile.timezone,
    durationMinutes: listing.durationMinutes,
  };
}
