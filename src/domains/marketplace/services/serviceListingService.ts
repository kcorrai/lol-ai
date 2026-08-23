import type { SessionKind } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { ownCoachProfileId } from "@/domains/marketplace/services/coachProfileService";
import {
  MIN_PRICE_CENTS,
  MAX_PRICE_CENTS,
  MIN_DURATION_MINUTES,
  MAX_DURATION_MINUTES,
  isScheduled,
} from "@/domains/marketplace/policy";
import type { Listing } from "@/domains/marketplace/types";

// What a coach sells. One row per product — an hour of VOD review and a
// 90-minute live session are different things at different prices, and a single
// "hourly rate" cannot express that.

export interface ListingInput {
  kind: SessionKind;
  title: string;
  description: string;
  durationMinutes: number;
  priceCents: number;
  currency: string;
  /** Async only. Ignored — and nulled — for the scheduled kinds. */
  deliveryHours: number | null;
}

const LISTING_SELECT = {
  id: true,
  kind: true,
  title: true,
  description: true,
  durationMinutes: true,
  priceCents: true,
  currency: true,
  deliveryHours: true,
} as const;

export type ListingOutcome =
  | { ok: true; listing: Listing }
  | { ok: false; reason: "no-profile" | "not-found" | "invalid"; detail?: string };

/** Every listing a coach owns, active or not — this is their own management view. */
export async function listOwnListings(
  userId: string
): Promise<(Listing & { isActive: boolean })[]> {
  const profileId = await ownCoachProfileId(userId);
  if (!profileId) return [];

  const rows = await prisma.coachListing.findMany({
    where: { coachProfileId: profileId },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    select: { ...LISTING_SELECT, isActive: true },
  });

  return rows;
}

/** The active listings on a coach's public profile. */
export async function publicListings(coachProfileId: string): Promise<Listing[]> {
  return prisma.coachListing.findMany({
    where: { coachProfileId, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { priceCents: "asc" }],
    select: LISTING_SELECT,
  });
}

export async function createListing(userId: string, input: ListingInput): Promise<ListingOutcome> {
  const profileId = await ownCoachProfileId(userId);
  if (!profileId) return { ok: false, reason: "no-profile" };

  const invalid = validate(input);
  if (invalid) return { ok: false, reason: "invalid", detail: invalid };

  // Appended rather than inserted: a new product goes to the bottom of the
  // coach's own ordering, which is the only place it cannot displace anything.
  const count = await prisma.coachListing.count({ where: { coachProfileId: profileId } });

  const listing = await prisma.coachListing.create({
    data: { coachProfileId: profileId, sortOrder: count, ...normalise(input) },
    select: LISTING_SELECT,
  });

  return { ok: true, listing };
}

export async function updateListing(
  userId: string,
  listingId: string,
  input: ListingInput
): Promise<ListingOutcome> {
  const profileId = await ownCoachProfileId(userId);
  if (!profileId) return { ok: false, reason: "no-profile" };

  const invalid = validate(input);
  if (invalid) return { ok: false, reason: "invalid", detail: invalid };

  // Scoped by owner in the same statement, so a guessed id belonging to another
  // coach updates nothing rather than updating theirs.
  const { count } = await prisma.coachListing.updateMany({
    where: { id: listingId, coachProfileId: profileId },
    data: normalise(input),
  });
  if (count === 0) return { ok: false, reason: "not-found" };

  const listing = await prisma.coachListing.findUniqueOrThrow({
    where: { id: listingId },
    select: LISTING_SELECT,
  });
  return { ok: true, listing };
}

/**
 * Take a listing off sale, or put it back.
 *
 * Deactivated rather than deleted wherever a booking might reference it —
 * `bookings.listingId` is a real foreign key, and a settled session has to keep
 * pointing at what was sold.
 */
export async function setListingActive(
  userId: string,
  listingId: string,
  isActive: boolean
): Promise<boolean> {
  const profileId = await ownCoachProfileId(userId);
  if (!profileId) return false;

  const { count } = await prisma.coachListing.updateMany({
    where: { id: listingId, coachProfileId: profileId },
    data: { isActive },
  });
  return count > 0;
}

/**
 * Delete a listing outright.
 *
 * Refused once anything has been booked against it: the booking's price and
 * terms are already snapshotted, but the row it points at is what tells a
 * dispute what was actually being sold.
 */
export async function deleteListing(userId: string, listingId: string): Promise<ListingOutcome> {
  const profileId = await ownCoachProfileId(userId);
  if (!profileId) return { ok: false, reason: "no-profile" };

  const owned = await prisma.coachListing.findFirst({
    where: { id: listingId, coachProfileId: profileId },
    select: { ...LISTING_SELECT, _count: { select: { bookings: true } } },
  });
  if (!owned) return { ok: false, reason: "not-found" };

  if (owned._count.bookings > 0) {
    return {
      ok: false,
      reason: "invalid",
      detail: "This has been booked before, so it can only be taken off sale.",
    };
  }

  await prisma.coachListing.delete({ where: { id: listingId } });
  return { ok: true, listing: owned };
}

/** The first thing wrong with a listing, phrased for the coach. Null when it is fine. */
function validate(input: ListingInput): string | null {
  if (input.priceCents < MIN_PRICE_CENTS || input.priceCents > MAX_PRICE_CENTS) {
    return `Price must be between ${MIN_PRICE_CENTS / 100} and ${MAX_PRICE_CENTS / 100}.`;
  }
  if (
    input.durationMinutes < MIN_DURATION_MINUTES ||
    input.durationMinutes > MAX_DURATION_MINUTES
  ) {
    return `Length must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES} minutes.`;
  }
  if (!isScheduled(input.kind) && (input.deliveryHours ?? 0) < 1) {
    return "An async review needs a turnaround you are promising, in hours.";
  }
  return null;
}

/** Strips the fields that do not apply to the chosen kind, rather than storing a lie. */
function normalise(input: ListingInput) {
  return {
    kind: input.kind,
    title: input.title,
    description: input.description,
    durationMinutes: input.durationMinutes,
    priceCents: input.priceCents,
    currency: input.currency,
    deliveryHours: isScheduled(input.kind) ? null : input.deliveryHours,
  };
}
