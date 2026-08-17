"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
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
import { ListingForm } from "@/domains/marketplace/components/ListingForm";
import { ListingRow } from "@/domains/marketplace/components/ListingRow";

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

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Listings</h1>
          <p className="mt-1 text-sm text-text-muted">
            What you sell, how long it takes and what it costs. You set the price; the platform
            takes its cut from it rather than adding to it.
          </p>
        </div>
        {!adding && (
          <Button onClick={() => setAdding(true)}>Add a listing</Button>
        )}
      </div>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {adding && (
        <ListingForm saving={create.isPending} onSubmit={handleCreate} onCancel={() => setAdding(false)} />
      )}

      {isLoading && <Skeleton className="h-40 w-full" />}

      {isError && <ErrorState message="Could not load your listings." onRetry={() => void refetch()} />}

      {data !== undefined && data.listings.length === 0 && !adding && (
        <EmptyState
          title="Nothing on sale yet"
          description="A profile with no listings cannot be booked. Add the first thing you want to sell."
          action={<Button onClick={() => setAdding(true)}>Add a listing</Button>}
        />
      )}

      <div className="space-y-3">
        {data?.listings.map((listing) =>
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
    </div>
  );
}
