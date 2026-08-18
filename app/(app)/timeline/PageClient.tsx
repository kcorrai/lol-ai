"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { CareerHeader } from "@/components/timeline/CareerHeader";
import { EraBand } from "@/components/timeline/EraBand";
import { TimelineFilters } from "@/components/timeline/TimelineFilters";
import type { TimelineFilter } from "@/components/timeline/TimelineFilters";
import { useCareerTimeline } from "@/hooks/useCareerTimeline";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useUIStore } from "@/lib/stores/uiStore";

function Shell({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <div className="mx-auto flex max-w-[900px] flex-col gap-5 p-5 md:p-6">{children}</div>;
}

function EmptyState({ title, body }: { title: string; body: string }): React.JSX.Element {
  return (
    <div className="notch border border-border bg-surface px-5 py-8 text-center">
      <p className="font-display text-base font-bold text-text">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-[13px] text-text-muted">{body}</p>
    </div>
  );
}

export default function CareerTimelinePage(): React.JSX.Element {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const activeAccountId = useUIStore((s) => s.activeRiotAccountId);
  const riotAccountId = activeAccountId ?? accounts?.[0]?.id ?? null;

  const [filter, setFilter] = useState<TimelineFilter>("all");
  const { data, isLoading, isError } = useCareerTimeline(riotAccountId);

  const bands = useMemo(() => {
    if (!data) return [];
    if (filter === "all") return data.bands;
    // A filtered view drops months that have nothing to say under that lens — keeping
    // them would be pages of empty bands between the two entries being looked for.
    return data.bands
      .map((band) => ({ ...band, events: band.events.filter((e) => e.group === filter) }))
      .filter((band) => band.events.length > 0);
  }, [data, filter]);

  if (accountsLoading || (riotAccountId && isLoading)) {
    return (
      <Shell>
        <Skeleton className="h-52 w-full" />
        <Skeleton className="h-64 w-full" />
      </Shell>
    );
  }

  if (!riotAccountId) {
    return (
      <Shell>
        <EmptyState
          title="No account linked yet"
          body="Link a Riot account and your timeline starts filling in from the games we can still reach."
        />
        <Link href="/settings/accounts" className="mx-auto text-[13px] font-semibold text-accent hover:underline">
          Link an account →
        </Link>
      </Shell>
    );
  }

  if (isError || !data) {
    return (
      <Shell>
        <EmptyState
          title="Your timeline could not be built"
          body="Nothing has been lost — try again in a moment."
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <CareerHeader summary={data.summary} lpSeries={data.lpSeries} />

      {data.summary.totalGames === 0 ? (
        <EmptyState
          title="Nothing to look back on yet"
          body="Once your games have synced, the months you played them fill in here."
        />
      ) : (
        <>
          <TimelineFilters active={filter} onChange={setFilter} />

          <div className="flex flex-col gap-6">
            {bands.map((band) => (
              <EraBand key={band.key} band={band} />
            ))}
          </div>

          {bands.length === 0 && (
            <EmptyState
              title="Nothing under that filter"
              body="This part of your career has not happened yet. Try another lens."
            />
          )}
        </>
      )}
    </Shell>
  );
}
