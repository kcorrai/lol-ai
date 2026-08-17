import { prisma } from "@/lib/db/prisma";

// What the marketplace contributes to the sitemap.
//
// Coach profiles only, and only ones worth a crawl. Filtered storefront URLs
// are deliberately absent: the filter space is combinatorial, every combination
// renders the same handful of coaches, and submitting thousands of
// near-identical URLs is how a section gets its thin pages filtered out — the
// same reasoning as ADR-017 §4 for esports.

export interface MarketplaceSitemapEntry {
  path: string;
  lastModified?: Date;
}

/**
 * Approved coaches with something on sale.
 *
 * A profile with no active listing is a page that cannot be acted on, so it is
 * left out until it can be — a coach who publishes a listing is picked up on
 * the next crawl.
 */
export async function marketplaceSitemapEntries(): Promise<MarketplaceSitemapEntry[]> {
  const coaches = await prisma.coachProfile.findMany({
    where: {
      status: "APPROVED",
      slug: { not: null },
      listings: { some: { isActive: true } },
    },
    select: { slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 5000,
  });

  return [
    { path: "/coaches" },
    ...coaches.map((coach) => ({
      path: `/coaches/${coach.slug as string}`,
      lastModified: coach.updatedAt,
    })),
  ];
}
