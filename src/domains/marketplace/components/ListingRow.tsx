"use client";

import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_COMMISSION_BPS, splitPrice } from "@/domains/marketplace/policy";
import { formatMoney } from "@/domains/marketplace/money";
import { kindLabel } from "@/domains/marketplace/components/options";
import { StatusChip } from "@/domains/marketplace/components/hud/StatusChip";
import type { OwnListing } from "@/hooks/useCoachListings";

interface Props {
  listing: OwnListing;
  busy: boolean;
  onEdit: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

/**
 * One listing in the coach's own management list.
 *
 * It shows the take-home, not just the price. A coach setting a number should
 * see what actually reaches them at the moment they set it — finding out later,
 * from a payout, is how a marketplace's fee becomes a grievance.
 *
 * The strip underneath is how the listing is *selling*, which is the question a
 * coach opens this page with. Every cell in it is counted from bookings and
 * revealed reviews; there is no view counter here because nothing counts views.
 */
export function ListingRow({
  listing,
  busy,
  onEdit,
  onToggleActive,
  onDelete,
}: Props): React.ReactElement {
  const { coachEarningsCents } = splitPrice(listing.priceCents, DEFAULT_COMMISSION_BPS);
  const perf = listing.performance;

  return (
    <section
      className={cn(
        "notch overflow-hidden border bg-surface",
        listing.isActive ? "border-border" : "border-line-2 opacity-75"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4 p-5">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h3
              className={cn(
                "font-display text-[17px] font-extrabold uppercase tracking-[0.03em]",
                listing.isActive ? "text-text" : "text-text-muted"
              )}
            >
              {listing.title}
            </h3>
            <StatusChip tone={listing.isActive ? "good" : "neutral"}>
              {kindLabel(listing.kind)}
            </StatusChip>
            {!listing.isActive && <StatusChip tone="warn">Off sale</StatusChip>}
          </div>

          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-faint">
            {listing.durationMinutes} min
            {listing.deliveryHours !== null && ` · delivered within ${listing.deliveryHours}h`}
          </p>

          <p className="mt-3 max-w-[66ch] whitespace-pre-wrap text-sm text-text-body">
            {listing.description}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-mono text-2xl font-bold leading-none text-text">
            {formatMoney(listing.priceCents, listing.currency)}
          </p>
          <p className="mt-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] text-accent">
            you keep {formatMoney(coachEarningsCents, listing.currency)}
          </p>
        </div>
      </div>

      {perf && perf.requests > 0 && (
        <div className="grid gap-px border-t border-line-1 bg-line-1 sm:grid-cols-3">
          <Cell label="Requests" value={String(perf.requests)} unit="lifetime" />
          <Cell
            label="Accepted"
            value={perf.acceptRate === null ? "—" : `${Math.round(perf.acceptRate * 100)}%`}
            unit="of decided"
            accent={perf.acceptRate !== null && perf.acceptRate >= 0.8}
          />
          <Cell
            label="Rating"
            value={perf.rating === null ? "—" : perf.rating.toFixed(1)}
            unit="on this listing"
            accent={perf.rating !== null}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3.5 border-t border-line-1 px-5 py-3">
        <Button size="sm" variant="ghost" onClick={onEdit} disabled={busy}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          Edit
        </Button>
        <button
          type="button"
          onClick={onToggleActive}
          disabled={busy}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-text-muted hover:text-text disabled:opacity-50"
        >
          {listing.isActive ? "Take off sale" : "Put back on sale"}
        </button>
        <button
          type="button"
          onClick={onDelete}
          disabled={busy}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-danger hover:text-danger/80 disabled:opacity-50"
        >
          Delete
        </button>
        <span className="ml-auto font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          {listing.isActive ? "Live on your public profile" : "Hidden from the storefront"}
        </span>
      </div>
    </section>
  );
}

function Cell({
  label,
  value,
  unit,
  accent,
}: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
}): React.ReactElement {
  return (
    <div className="bg-background px-4 py-3">
      <p className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-text-muted">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span
          className={cn(
            "font-mono text-[17px] font-bold leading-none",
            accent ? "text-accent" : "text-text"
          )}
        >
          {value}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-faint">
          {unit}
        </span>
      </p>
    </div>
  );
}
