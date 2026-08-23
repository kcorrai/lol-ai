"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { ArchiveFilterConsole } from "@/domains/match/components/archive/ArchiveFilterConsole";
import { ArchiveResultList } from "@/domains/match/components/archive/ArchiveResultList";
import { ArchiveTotalsStrip } from "@/domains/match/components/archive/ArchiveTotalsStrip";
import { SavedSearchBar } from "@/domains/match/components/archive/SavedSearchBar";
import { describeFilters } from "@/domains/match/archive/archiveLabels";
import { isEmptyFilters } from "@/domains/match/archive/archiveQuery";
import { useArchiveFilters } from "@/hooks/useArchiveFilters";
import { archiveRows, archiveTotals, useMatchArchive } from "@/hooks/useMatchArchive";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useUIStore } from "@/lib/stores/uiStore";

export default function MatchSearchPage(): React.JSX.Element {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const activeId = useUIStore((state) => state.activeRiotAccountId);
  // The selector in the top bar owns the choice; falling back to the primary account keeps the
  // page readable on a first visit, before the store has been hydrated with a selection.
  const account =
    accounts?.find((candidate) => candidate.id === activeId) ??
    accounts?.find((candidate) => candidate.isPrimary) ??
    accounts?.[0];
  const riotAccountId = account?.id ?? null;

  const { filters, setFilters, clearFilters } = useArchiveFilters();
  const query = useMatchArchive(riotAccountId, filters);

  const rows = archiveRows(query.data);
  const totals = archiveTotals(query.data);
  const isFiltered = !isEmptyFilters(filters);
  const description = describeFilters(filters);

  if (accountsLoading) return <PageSkeleton />;

  if (!accounts || accounts.length === 0) {
    return (
      <div className="mx-auto max-w-6xl p-6">
        <EmptyState
          icon={<Gamepad2 className="h-16 w-16" />}
          title="Riot Account Not Connected"
          description="Connect your League of Legends account to search your match history."
          action={
            <Link href="/settings/accounts">
              <Button size="lg">Connect Account</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b border-line-1 bg-surface/70 px-5 backdrop-blur md:px-8">
        <Link
          href="/dashboard"
          className="font-mono text-[10.5px] uppercase tracking-label text-fg-3 hover:text-fg-1"
        >
          ← Dashboard
        </Link>
        <span className="h-4 w-px bg-line-2" />
        <h1 className="font-display text-sm font-bold uppercase tracking-wide text-fg-1">
          Match search
        </h1>
        {account && (
          <span className="hidden truncate font-mono text-[10.5px] uppercase tracking-wide text-fg-4 lg:inline">
            {account.gameName}#{account.tagLine}
            {totals ? ` · ${totals.games} games` : ""}
          </span>
        )}
      </header>

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-5 md:px-8">
        <SavedSearchBar filters={filters} onApply={setFilters} />

        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <ArchiveFilterConsole
            filters={filters}
            onApply={setFilters}
            onClear={clearFilters}
            riotAccountId={riotAccountId}
          />

          <div className="min-w-0 space-y-4">
            <ArchiveTotalsStrip totals={totals} isLoading={query.isLoading} />

            {description.length > 0 && (
              <p className="font-mono text-[10.5px] uppercase tracking-label text-fg-4">
                {description.join(" · ")}
              </p>
            )}

            <ArchiveResultList
              rows={rows}
              isLoading={query.isLoading}
              error={query.error}
              onRetry={() => void query.refetch()}
              isFiltered={isFiltered}
              hasNextPage={query.hasNextPage}
              isFetchingNextPage={query.isFetchingNextPage}
              onLoadMore={() => void query.fetchNextPage()}
              onClearFilters={clearFilters}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
