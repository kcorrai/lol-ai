import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/domains/marketplace/types";
import { kindLabel } from "@/domains/marketplace/components/options";
import { ListingBookPanel } from "@/domains/marketplace/components/ListingBookPanel";

interface Props {
  listing: Listing;
  coachSlug: string;
  acceptingStudents: boolean;
}

/**
 * One thing a coach sells, as a student reads it.
 *
 * Still a server component. `ListingBookPanel` is the only client boundary on
 * the card, so the page keeps rendering for search engines and for anyone with
 * JavaScript off — which matters, because this is the page the section is
 * trying to get found on.
 */
export function ListingCard({ listing, coachSlug, acceptingStudents }: Props): React.ReactElement {
  return (
    <article className="rounded-lg border border-border bg-surface p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-text">{listing.title}</h3>
            <Badge variant="secondary">{kindLabel(listing.kind)}</Badge>
          </div>
          <p className="mt-1 text-xs text-text-muted">
            {listing.durationMinutes} min
            {listing.deliveryHours !== null && ` · delivered within ${listing.deliveryHours}h`}
          </p>
        </div>

        <p className="shrink-0 font-mono text-lg text-text">
          {new Intl.NumberFormat(undefined, {
            style: "currency",
            currency: listing.currency,
          }).format(listing.priceCents / 100)}
        </p>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm text-text-body">{listing.description}</p>

      <ListingBookPanel
        coachSlug={coachSlug}
        listing={listing}
        acceptingStudents={acceptingStudents}
      />
    </article>
  );
}
