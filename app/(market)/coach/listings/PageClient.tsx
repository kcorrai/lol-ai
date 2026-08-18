"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import {
  useCoachListings,
  useCreateListing,
  useUpdateListing,
  useSetListingActive,
  useDeleteListing,
} from "@/hooks/useCoachListings";
import type { OwnListing } from "@/hooks/useCoachListings";
import type { ListingBodyInput } from "@/domains/marketplace/listingSchema";
import { DEFAULT_COMMISSION_BPS } from "@/domains/marketplace/policy";
import { ListingForm } from "@/domains/marketplace/components/ListingForm";
import { ListingRow } from "@/domains/marketplace/components/ListingRow";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
import { HudPanel } from "@/domains/marketplace/components/hud/HudPanel";
import { ConsoleBreadcrumb } from "@/domains/marketplace/components/console/ConsoleBreadcrumb";

const KEEP_PCT = 100 - DEFAULT_COMMISSION_BPS / 100;

const TIPS = [
  "Name the role and the habit you fix, not the format.",
  "Promise something checkable — timestamped notes, a first-clear plan.",
  "One cheap entry listing brings more first bookings than three expensive ones.",
];

export default function CoachListingsPage(): React.ReactElement {
  const { data, isLoading, isError, refetch } = useCoachListings();
  const create = useCreateListing();
  const update = useUpdateListing();
  const setActive = useSetListingActive();
  const remove = useDeleteListing();

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(input: ListingBodyInput): Promise<void> {
    await create.mutateAsync(input);
    setAdding(false);
  }

  async function handleUpdate(id: string, input: ListingBodyInput): Promise<void> {
    await update.mutateAsync({ id, ...input });
    setEditing(null);
  }

  function handleDelete(listing: OwnListing): void {
    setError(null);
    remove.mutate(listing.id, {
      onError: (err) =>
        setError(err instanceof Error ? err.message : "Could not delete that listing."),
    });
  }

  const listings = data?.listings ?? [];
  const onSale = listings.filter((l) => l.isActive).length;

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-7 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <ConsoleBreadcrumb current="Listings" />
          <h1 className="mt-3.5 font-display text-[32px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[38px]">
            Listings
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] text-text-body">
            What you sell, how long it takes and what it costs. You set the price — the platform
            takes its cut from it rather than adding to it.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-6">
          <div className="flex gap-6">
            <MarketStat label="On sale" value={String(onSale)} />
            <MarketStat label="You keep" value={String(KEEP_PCT)} unit="%" tone="accent" />
          </div>
          {!adding && (
            <Button size="sm" onClick={() => setAdding(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add a listing
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="grid min-w-0 gap-3.5">
          {error && (
            <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </p>
          )}

          {adding && (
            <ListingForm
              saving={create.isPending}
              onSubmit={handleCreate}
              onCancel={() => setAdding(false)}
            />
          )}

          {isLoading && <Skeleton className="h-40 w-full" />}

          {isError && (
            <ErrorState message="Could not load your listings." onRetry={() => void refetch()} />
          )}

          {data !== undefined && listings.length === 0 && !adding && (
            <section className="notch border border-dashed border-line-2 bg-surface px-7 py-12 text-center">
              <p className="font-display text-[22px] font-extrabold uppercase tracking-[0.03em] text-text">
                Nothing on sale yet
              </p>
              <p className="mx-auto mt-3 max-w-[48ch] text-[14.5px] text-text-body">
                Students cannot book you until there is at least one listing. A single replay
                review is enough to start.
              </p>
              <Button className="mt-5" onClick={() => setAdding(true)}>
                <Plus className="h-4 w-4" aria-hidden />
                Add your first listing
              </Button>
            </section>
          )}

          {listings.map((listing) =>
            editing === listing.id ? (
              <ListingForm
                key={listing.id}
                initial={listing}
                saving={update.isPending}
                onSubmit={(input) => handleUpdate(listing.id, input)}
                onCancel={() => setEditing(null)}
              />
            ) : (
              <ListingRow
                key={listing.id}
                listing={listing}
                busy={setActive.isPending || remove.isPending}
                onEdit={() => setEditing(listing.id)}
                onToggleActive={() =>
                  setActive.mutate({ id: listing.id, isActive: !listing.isActive })
                }
                onDelete={() => handleDelete(listing)}
              />
            )
          )}
        </div>

        <div className="grid gap-3.5 lg:sticky lg:top-20">
          <HudPanel label="How the cut works" className="bg-hero-fade">
            <p className="text-[13.5px] text-text-body">
              The price a student pays is the price you set. LaneIQ takes{" "}
              {DEFAULT_COMMISSION_BPS / 100}% out of it — nothing is added on top, so booking you
              here is not more expensive than booking you directly.
            </p>
            <dl className="mt-3.5 grid gap-2.5 border-t border-line-1 pt-3">
              <CutRow label="A $30 review" value="you keep $24" />
              <CutRow label="A $50 hour" value="you keep $40" />
              <CutRow label="Paid out" value="when the session settles" muted />
            </dl>
          </HudPanel>

          <HudPanel label="A good listing">
            <ul className="grid gap-2.5">
              {TIPS.map((tip) => (
                <li key={tip} className="grid grid-cols-[14px_1fr] items-start gap-2.5">
                  <span className="mt-1.5 h-[5px] w-[5px] bg-accent" aria-hidden />
                  <span className="text-[13px] text-text-body">{tip}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3.5 border-t border-line-1 pt-3 text-[12.5px] text-text-muted">
              A listing with no{" "}
              <Link href="/coach/availability" className="text-accent hover:underline">
                open hours
              </Link>{" "}
              behind it cannot be booked, however good it reads.
            </p>
          </HudPanel>
        </div>
      </div>
    </div>
  );
}

function CutRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-[13px] text-text-muted">{label}</dt>
      <dd className={`font-mono text-[12.5px] ${muted ? "text-text-muted" : "text-accent"}`}>
        {value}
      </dd>
    </div>
  );
}
