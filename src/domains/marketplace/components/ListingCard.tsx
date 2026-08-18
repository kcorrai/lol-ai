import { formatMoney } from "@/domains/marketplace/money";
import type { Listing } from "@/domains/marketplace/types";
import { kindLabel } from "@/domains/marketplace/components/options";
import { ListingBookPanel } from "@/domains/marketplace/components/ListingBookPanel";
import { isScheduled } from "@/domains/marketplace/policy";

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
    <article className="notch overflow-hidden border border-border bg-surface">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3 className="font-display text-[17px] font-extrabold uppercase tracking-[0.03em] text-text">
              {listing.title}
            </h3>
            <span
              className={
                isScheduled(listing.kind)
                  ? "tag-cut border border-accent bg-accent/10 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-accent"
                  : "tag-cut border border-line-2 bg-surface-dark px-2 py-1 font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted"
              }
            >
              {kindLabel(listing.kind)}
            </span>
          </div>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
            {listing.durationMinutes} min
            {listing.deliveryHours !== null && ` · delivered within ${listing.deliveryHours}h`}
          </p>

          <p className="mt-3 max-w-[64ch] whitespace-pre-wrap text-[14.5px] text-text-body">
            {listing.description}
          </p>
        </div>

        <p className="shrink-0 text-right">
          <span className="block font-mono text-2xl font-bold leading-none text-text">
            {formatMoney(listing.priceCents, listing.currency)}
          </span>
          <span className="mt-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-text-faint">
            {isScheduled(listing.kind) ? "per session" : "per game"}
          </span>
        </p>
      </div>

      <div className="px-5 pb-5">
        <ListingBookPanel
          coachSlug={coachSlug}
          listing={listing}
          acceptingStudents={acceptingStudents}
        />
      </div>
    </article>
  );
}
