import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";

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
 *
 * The read is allowed to fail. `/sitemap.xml` is prerendered, and ADR-012 moved
 * migrations out of the build precisely so a build never depends on the
 * database being up *or* in step with this checkout: migrations land in a
 * separate release step, so code routinely deploys ahead of its own schema.
 * Reading `coach_profiles` unguarded gave the file a veto over the whole deploy
 * — an unapplied migration (P2021), an unreachable host (P1001) or an exhausted
 * quota each took production down, which is what happened on a90cf442. The
 * storefront root needs no database, so a failed read costs the file its
 * per-coach URLs for one round and nothing more; the next build picks them up.
 * Same rule as the esports source: a file missing one section beats no file.
 */
export async function marketplaceSitemapEntries(): Promise<MarketplaceSitemapEntry[]> {
  const storefront: MarketplaceSitemapEntry[] = [{ path: "/coaches" }];

  try {
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
      ...storefront,
      ...coaches.map((coach) => ({
        path: `/coaches/${coach.slug as string}`,
        lastModified: coach.updatedAt,
      })),
    ];
  } catch (err) {
    logger.warn("[marketplace] sitemap coach read failed, emitting the storefront only", err);
    return storefront;
  }
}
