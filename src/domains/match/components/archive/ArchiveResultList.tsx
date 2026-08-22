"use client";

import Link from "next/link";
import { SearchX, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ArchiveResultRow } from "@/domains/match/components/archive/ArchiveResultRow";
import type { ArchiveRow } from "@/domains/match/services/matchArchiveService";

interface ArchiveResultListProps {
  rows: ArchiveRow[];
  isLoading: boolean;
  error: Error | null;
  onRetry: () => void;
  /** False when no facet is set — which makes an empty result a different sentence entirely. */
  isFiltered: boolean;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  onLoadMore: () => void;
  onClearFilters: () => void;
}

export function ArchiveResultList({
  rows,
  isLoading,
  error,
  onRetry,
  isFiltered,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onClearFilters,
}: ArchiveResultListProps): React.JSX.Element {
  if (error) {
    return <ErrorState title="Search failed" message={error.message} onRetry={onRetry} />;
  }

  if (isLoading) {
    return (
      <div className="space-y-1.5">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} className="h-[62px] w-full" />
        ))}
      </div>
    );
  }

  // Two different nothings. "You have no matches" is a problem with the account and is fixed by
  // syncing; "nothing matched" is a problem with the question and is fixed by asking another one.
  // Showing the same empty state for both sends half the people who see it to the wrong place.
  if (rows.length === 0) {
    return isFiltered ? (
      <EmptyState
        icon={<SearchX className="h-14 w-14" />}
        title="No matches for this search"
        description="Nothing in your archive fits all of these filters. Loosen one and try again."
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            Clear filters
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={<Swords className="h-14 w-14" />}
        title="No matches in your archive yet"
        description="Once your account has synced, every game you play lands here and becomes searchable."
        action={
          <Link href="/settings/accounts">
            <Button>Sync your account</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row) => (
        <ArchiveResultRow key={row.participantId} row={row} />
      ))}

      {hasNextPage && (
        <Button
          variant="secondary"
          className="w-full"
          onClick={onLoadMore}
          disabled={isFetchingNextPage}
        >
          {isFetchingNextPage ? "Loading…" : "Load more"}
        </Button>
      )}

      {!hasNextPage && (
        <p className="py-4 text-center font-mono text-[10px] uppercase tracking-label text-fg-4">
          End of results · {rows.length} shown
        </p>
      )}
    </div>
  );
}
