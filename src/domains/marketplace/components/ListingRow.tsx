"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DEFAULT_COMMISSION_BPS, splitPrice } from "@/domains/marketplace/policy";
import { kindLabel } from "@/domains/marketplace/components/options";
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
 */
export function ListingRow({
  listing,
  busy,
  onEdit,
  onToggleActive,
  onDelete,
}: Props): React.ReactElement {
  const { coachEarningsCents } = splitPrice(listing.priceCents, DEFAULT_COMMISSION_BPS);

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-4",
        !listing.isActive && "opacity-60"
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-text">{listing.title}</p>
            <Badge variant="secondary">{kindLabel(listing.kind)}</Badge>
            {!listing.isActive && <Badge variant="outline">Off sale</Badge>}
          </div>
          <p className="mt-1 line-clamp-2 text-xs text-text-muted">{listing.description}</p>
        </div>

        <div className="text-right">
          <p className="font-mono text-base text-text">
            {money(listing.priceCents, listing.currency)}
          </p>
          <p className="font-mono text-[11px] text-text-faint">
            you keep {money(coachEarningsCents, listing.currency)}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-muted">
        <span>{listing.durationMinutes} min</span>
        {listing.deliveryHours !== null && <span>within {listing.deliveryHours}h</span>}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit} disabled={busy}>
          <Pencil className="h-3 w-3" aria-hidden />
          Edit
        </Button>
        <Button size="sm" variant="ghost" onClick={onToggleActive} disabled={busy}>
          {listing.isActive ? "Take off sale" : "Put on sale"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDelete} disabled={busy}>
          <Trash2 className="h-3 w-3" aria-hidden />
          Delete
        </Button>
      </div>
    </div>
  );
}

function money(cents: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100);
}
