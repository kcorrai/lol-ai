import type { CoachPublicProfile } from "@/domains/marketplace/types";
import { formatRank } from "@/domains/marketplace/rank";

// Structured data for coach profiles.
//
// Only facts that are on the page go in here. A rating we withhold from readers
// because the sample is too small does not get quietly handed to a search
// engine instead — that is exactly the kind of thing rich-result policies treat
// as misrepresentation, and it would also be lying.

export interface JsonLdInput {
  coach: CoachPublicProfile;
  url: string;
}

/**
 * A coach profile as `Person` offering `Service`s.
 *
 * `Person` rather than `Product`: what is on sale is somebody's time, and the
 * offers hang off them.
 */
export function coachProfileJsonLd({ coach, url }: JsonLdInput): Record<string, unknown> {
  const offers = coach.listings.map((listing) => ({
    "@type": "Offer",
    name: listing.title,
    description: listing.description,
    price: (listing.priceCents / 100).toFixed(2),
    priceCurrency: listing.currency,
    availability: coach.acceptingStudents
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
    url,
  }));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: coach.displayName,
    description: coach.headline,
    url,
    knowsLanguage: coach.languages,
    jobTitle: "League of Legends Coach",
    makesOffer: offers,
  };

  if (coach.badge) {
    // The rank, stated as what it is: a credential we checked, with the date.
    jsonLd.hasCredential = {
      "@type": "EducationalOccupationalCredential",
      credentialCategory: "League of Legends rank",
      name: formatRank({
        tier: coach.badge.tier,
        division: coach.badge.division,
        leaguePoints: coach.badge.leaguePoints,
      }),
      dateCreated: coach.badge.checkedAt,
      recognizedBy: { "@type": "Organization", name: "LaneIQ" },
    };
  }

  // Only once there are enough reviews to show a reader a number. Handing a
  // search engine a rating the page itself withholds would be a lie with extra
  // steps.
  if (coach.rating !== null && coach.ratingCount > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: coach.rating.toFixed(1),
      reviewCount: coach.ratingCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return jsonLd;
}

/** The storefront itself, as a collection page. */
export function coachesIndexJsonLd(url: string, total: number): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "League of Legends coaches",
    description:
      "Human League of Legends coaches whose rank is read from a linked Riot account and shown dated.",
    url,
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: total,
    },
  };
}
