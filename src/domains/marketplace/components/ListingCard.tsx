import { Badge } from "@/components/ui/badge";
import type { Listing } from "@/domains/marketplace/types";
import { kindLabel } from "@/domains/marketplace/components/options";

interface Props {
  listing: Listing;
}

/**
 * One thing a coach sells, as a student reads it.
 *
 * A server component: nothing here is interactive yet. The booking button
 * arrives with M7 and will be the only client boundary on this card.
 */
export function ListingCard({ listing }: Props): React.ReactElement {
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
    </article>
  );
}
