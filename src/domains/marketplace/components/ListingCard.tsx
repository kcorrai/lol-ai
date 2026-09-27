import { Clock, Eye, Film, Hourglass, Video } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
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

const KIND_ICON: Record<string, LucideIcon> = {
  VOD_REVIEW: Film,
  LIVE_SESSION: Video,
  LIVE_SPECTATE: Eye,
};

/**
 * One thing a coach sells, as a student reads it.
 *
 * Still a server component. `ListingBookPanel` is the only client boundary on
 * the card, so the page keeps rendering for search engines and for anyone with
 * JavaScript off — which matters, because this is the page the section is
 * trying to get found on.
 */
export function ListingCard({ listing, coachSlug, acceptingStudents }: Props): React.ReactElement {
  const scheduled = isScheduled(listing.kind);
  const Icon = KIND_ICON[listing.kind] ?? Film;

  return (
    <article className="notch overflow-hidden border border-border bg-surface transition-colors hover:border-line-2">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
        <span
          className={cn(
            "notch-sm flex h-12 w-12 shrink-0 items-center justify-center border",
            scheduled
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-line-2 bg-surface-dark text-text-body"
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-mono text-[10px] uppercase tracking-[0.16em]",
              scheduled ? "text-accent" : "text-text-muted"
            )}
          >
            {kindLabel(listing.kind)}
          </p>
          <h3 className="mt-1 font-display text-[16px] font-extrabold uppercase leading-snug tracking-[0.03em] text-text">
            {listing.title}
          </h3>

          <div className="mt-2.5 flex flex-wrap gap-2 text-[12px] text-text-body">
            <Meta icon={Clock}>{listing.durationMinutes} min</Meta>
            {listing.deliveryHours !== null && (
              <Meta icon={Hourglass}>delivered within {listing.deliveryHours}h</Meta>
            )}
          </div>

          <p className="mt-3 max-w-[64ch] whitespace-pre-wrap text-[14px] leading-relaxed text-text-body">
            {listing.description}
          </p>
        </div>

        <p className="shrink-0 sm:text-right">
          <span className="font-mono text-[26px] font-bold leading-none text-text">
            {formatMoney(listing.priceCents, listing.currency)}
          </span>
          <span className="ml-2 text-[12px] text-text-muted sm:ml-0 sm:mt-1.5 sm:block">
            {scheduled ? "per session" : "per game"}
          </span>
        </p>
      </div>

      <div className="border-t border-line-1 bg-surface-dark/50 px-5 py-4">
        <ListingBookPanel
          coachSlug={coachSlug}
          listing={listing}
          acceptingStudents={acceptingStudents}
        />
      </div>
    </article>
  );
}

function Meta({ icon: Icon, children }: { icon: LucideIcon; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 border border-line-1 bg-surface-dark px-2 py-1">
      <Icon className="h-3.5 w-3.5 text-text-muted" aria-hidden />
      {children}
    </span>
  );
}
