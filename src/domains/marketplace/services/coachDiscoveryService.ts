import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { MIN_REVIEWS_FOR_SCORE } from "@/domains/marketplace/policy";
import { tiersAtOrAbove } from "@/domains/marketplace/rank";
import { PAGE_SIZE, pageOf } from "@/domains/marketplace/searchQuery";
import { badgesFor, BADGE_QUEUE } from "@/domains/marketplace/services/rankBadgeService";
import type { CoachCard, CoachSearchQuery, CoachSearchResult } from "@/domains/marketplace/types";

// The storefront's filtered search.
//
// Only APPROVED profiles are ever reachable here, and that is in the base
// `where` rather than applied afterwards — a discovery surface that can be made
// to leak a draft by adding a parameter is one bad refactor away from doing it.

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

/** Search the storefront. Page numbers, not cursors — see the note below. */
export async function searchCoaches(query: CoachSearchQuery): Promise<CoachSearchResult> {
  const where = buildWhere(query);
  const page = pageOf(query);
  const take = query.limit ?? PAGE_SIZE;

  const [rows, total] = await Promise.all([
    prisma.coachProfile.findMany({
      where,
      orderBy: orderFor(query),
      skip: (page - 1) * take,
      take,
      select: CARD_SELECT,
    }),
    prisma.coachProfile.count({ where }),
  ]);

  const badges = await badgesFor(rows.map((row) => row.id));

  return {
    coaches: rows.map((row) => toCard(row, badges.get(row.id) ?? null)),
    // Page numbers rather than the cursor convention the rest of the API uses
    // (API_DESIGN §0). This is a public, indexable surface: a cursor has no
    // stable URL for "page 3", and an unlinkable page is one search engines and
    // readers both lose.
    nextCursor: page * take < total ? String(page + 1) : null,
    total,
  };
}

function buildWhere(query: CoachSearchQuery): Prisma.CoachProfileWhereInput {
  const where: Prisma.CoachProfileWhereInput = {
    status: "APPROVED",
    slug: { not: null },
  };

  if (query.availableOnly !== false) where.acceptingStudents = true;
  if (query.role) where.roles = { has: query.role };
  if (query.language) where.languages = { has: query.language };
  if (query.region) where.regions = { has: query.region };
  if (query.championId) where.championIds = { has: query.championId };

  // A rank floor is a claim about the badge, so it only matches coaches whose
  // rank we have actually read — a self-reported tier must never satisfy
  // "Diamond and above".
  if (query.minTier) {
    where.rankProofs = {
      some: {
        queueType: BADGE_QUEUE,
        method: { in: ["PLATFORM_CHECKED", "RIOT_VERIFIED"] },
        tier: { in: tiersAtOrAbove(query.minTier) },
      },
    };
  }

  // Both listing filters land in one `some`, so "a live session under $40"
  // means one listing that is both — not a live session and, separately,
  // something cheap.
  const listing: Prisma.CoachListingWhereInput = { isActive: true };
  if (query.kind) listing.kind = query.kind;
  if (query.maxPriceCents) listing.priceCents = { lte: query.maxPriceCents };
  if (query.kind || query.maxPriceCents) where.listings = { some: listing };

  return where;
}

function orderFor(query: CoachSearchQuery): Prisma.CoachProfileOrderByWithRelationInput[] {
  switch (query.sort) {
    case "newest":
      return [{ publishedAt: "desc" }, { createdAt: "desc" }];
    // Price sorts run on the profile's cheapest active listing, which Prisma
    // cannot order by directly — so they order on the aggregate we do have and
    // the page sorts its own rows. Honest about being page-local.
    case "price_asc":
    case "price_desc":
      return [{ acceptingStudents: "desc" }, { ratingWilson: "desc" }];
    default:
      return [
        { acceptingStudents: "desc" },
        { ratingWilson: "desc" },
        { sessionsCompleted: "desc" },
      ];
  }
}

type CardRow = Prisma.CoachProfileGetPayload<{ select: typeof CARD_SELECT }>;

function toCard(row: CardRow, badge: CoachCard["badge"]): CoachCard {
  return {
    slug: row.slug as string,
    displayName: row.displayName,
    headline: row.headline,
    languages: row.languages,
    regions: row.regions,
    roles: row.roles,
    championIds: row.championIds,
    badge,
    // Withheld below the threshold: one five-star review is not a rating, and
    // showing it as one is how a marketplace's numbers stop meaning anything.
    rating: row.ratingCount >= MIN_REVIEWS_FOR_SCORE ? row.ratingBayes : null,
    ratingCount: row.ratingCount,
    sessionsCompleted: row.sessionsCompleted,
    fromPriceCents: row.listings[0]?.priceCents ?? null,
    currency: row.listings[0]?.currency ?? "USD",
    acceptingStudents: row.acceptingStudents,
  };
}

/** Sorts the page's own rows by price, since the database ordered on something else. */
export function sortPageByPrice(coaches: CoachCard[], direction: "asc" | "desc"): CoachCard[] {
  const sign = direction === "asc" ? 1 : -1;
  return [...coaches].sort((a, b) => {
    // Coaches with nothing on sale go last either way — there is no price to
    // compare, and they cannot be the cheapest thing on the page.
    if (a.fromPriceCents === null) return 1;
    if (b.fromPriceCents === null) return -1;
    return (a.fromPriceCents - b.fromPriceCents) * sign;
  });
}
