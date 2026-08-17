import { prisma } from "@/lib/db/prisma";
import { MIN_REVIEWS_FOR_SCORE } from "@/domains/marketplace/policy";
import { badgesFor } from "@/domains/marketplace/services/rankBadgeService";
import { publicListings } from "@/domains/marketplace/services/serviceListingService";
import { publicReviews } from "@/domains/marketplace/services/reviewService";
import type { CoachCard, CoachPublicProfile } from "@/domains/marketplace/types";

// The storefront's read side.
//
// Only APPROVED profiles are ever visible here, and that is enforced in the
// query rather than filtered afterwards — a listing surface that can be made to
// leak a draft by adding a parameter is one bad refactor away from doing it.

const CARD_SELECT = {
  id: true,
  slug: true,
  displayName: true,
  headline: true,
  languages: true,
  regions: true,
  roles: true,
  championIds: true,
  ratingBayes: true,
  ratingCount: true,
  sessionsCompleted: true,
  acceptingStudents: true,
  listings: {
    where: { isActive: true },
    orderBy: { priceCents: "asc" as const },
    take: 1,
    select: { priceCents: true, currency: true },
  },
} as const;

/**
 * Approved coaches for the storefront.
 *
 * Ordered by the Wilson lower bound rather than the displayed average, so a 5.0
 * from two people does not outrank a 4.8 from ninety. Coaches taking students
 * come first — a listing you cannot book is a worse result than one you can,
 * however good the coach is.
 */
export async function listCoaches(limit = 60): Promise<CoachCard[]> {
  const rows = await prisma.coachProfile.findMany({
    where: { status: "APPROVED", slug: { not: null } },
    orderBy: [
      { acceptingStudents: "desc" },
      { ratingWilson: "desc" },
      { sessionsCompleted: "desc" },
    ],
    take: limit,
    select: CARD_SELECT,
  });

  const badges = await badgesFor(rows.map((row) => row.id));

  return rows.map((row) => ({
    slug: row.slug as string,
    displayName: row.displayName,
    headline: row.headline,
    languages: row.languages,
    regions: row.regions,
    roles: row.roles,
    championIds: row.championIds,
    badge: badges.get(row.id) ?? null,
    // Withheld below the threshold: a single five-star review is not a rating,
    // and showing it as one is how every marketplace's numbers stop meaning
    // anything. The card shows a "New" badge instead.
    rating: row.ratingCount >= MIN_REVIEWS_FOR_SCORE ? row.ratingBayes : null,
    ratingCount: row.ratingCount,
    sessionsCompleted: row.sessionsCompleted,
    fromPriceCents: row.listings[0]?.priceCents ?? null,
    currency: row.listings[0]?.currency ?? "USD",
    acceptingStudents: row.acceptingStudents,
  }));
}

/**
 * One coach's public page: the card, their bio, and everything they sell.
 *
 * A second query for the listings rather than widening the card select, because
 * the storefront reads dozens of cards and needs one cheap listing each — the
 * profile is the only place the whole set is wanted.
 */
export async function getCoachProfilePage(slug: string): Promise<CoachPublicProfile | null> {
  const row = await prisma.coachProfile.findFirst({
    where: { slug, status: "APPROVED" },
    select: { ...CARD_SELECT, bio: true, timezone: true },
  });
  if (!row) return null;

  const [card, listings, reviews] = await Promise.all([
    getCoachBySlug(slug),
    publicListings(row.id),
    publicReviews(row.id),
  ]);
  if (!card) return null;

  return { ...card, bio: row.bio, timezone: row.timezone, listings, reviews };
}

/** One coach by slug, or null. Approved only, for the same reason as above. */
export async function getCoachBySlug(slug: string): Promise<CoachCard | null> {
  const row = await prisma.coachProfile.findFirst({
    where: { slug, status: "APPROVED" },
    select: CARD_SELECT,
  });
  if (!row) return null;

  const badges = await badgesFor([row.id]);

  return {
    slug: row.slug as string,
    displayName: row.displayName,
    headline: row.headline,
    languages: row.languages,
    regions: row.regions,
    roles: row.roles,
    championIds: row.championIds,
    badge: badges.get(row.id) ?? null,
    rating: row.ratingCount >= MIN_REVIEWS_FOR_SCORE ? row.ratingBayes : null,
    ratingCount: row.ratingCount,
    sessionsCompleted: row.sessionsCompleted,
    fromPriceCents: row.listings[0]?.priceCents ?? null,
    currency: row.listings[0]?.currency ?? "USD",
    acceptingStudents: row.acceptingStudents,
  };
}
