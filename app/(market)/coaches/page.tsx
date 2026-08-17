import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  searchCoaches,
  sortPageByPrice,
  parseSearchQuery,
  canonicalPath,
  isFiltered,
  pageOf,
} from "@/domains/marketplace";
import { EmptyState } from "@/components/ui/empty-state";
import { CoachCardTile } from "@/domains/marketplace/components/CoachCardTile";
import { CoachFilters } from "@/domains/marketplace/components/CoachFilters";
import { CoachPagination } from "@/domains/marketplace/components/CoachPagination";
import { coachesIndexJsonLd } from "@/domains/marketplace/jsonLd";

export const metadata: Metadata = {
  title: "Find a League of Legends Coach",
  description:
    "Book a human coach whose rank we read from their linked Riot account and show you dated. Replay reviews, live sessions and live game coaching.",
  alternates: { canonical: "/coaches" },
};

// Server-rendered from `searchParams` so every filtered view is a real, linkable
// URL. Dynamic rather than ISR for the same reason a search page usually is:
// the filter space is combinatorial and caching it would mostly cache misses.
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Record<string, string | string[] | undefined>;
}

export default async function CoachesPage({ searchParams }: Props) {
  const query = parseSearchQuery(searchParams);
  const result = await searchCoaches(query);
  const filtered = isFiltered(query);

  const coaches =
    query.sort === "price_asc"
      ? sortPageByPrice(result.coaches, "asc")
      : query.sort === "price_desc"
        ? sortPageByPrice(result.coaches, "desc")
        : result.coaches;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(coachesIndexJsonLd(`${baseUrl}/coaches`, result.total)),
        }}
      />

      <div className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-text">Find a coach</h1>
        <p className="mt-2 text-sm text-text-body">
          Every rank on this page was read from the coach&apos;s own linked Riot account and is
          shown with the date we last checked it. Nobody here typed their rank into a box.
        </p>
      </div>

      <Suspense fallback={<div className="h-40 rounded-lg border border-border bg-surface" />}>
        <CoachFilters filtered={filtered} total={result.total} />
      </Suspense>

      {coaches.length === 0 ? (
        <EmptyState
          title={filtered ? "No coach matches that" : "No coaches yet"}
          description={
            filtered
              ? "Try widening one of the filters — rank and price narrow this the fastest."
              : "The first coaches are being reviewed. If you coach, this is a good moment to apply."
          }
          action={
            filtered ? (
              <Link href="/coaches" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background">
                Clear filters
              </Link>
            ) : (
              <Link href="/coach/apply" className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-background">
                Become a coach
              </Link>
            )
          }
        />
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {coaches.map((coach) => (
              <CoachCardTile key={coach.slug} coach={coach} />
            ))}
          </div>

          <CoachPagination
            page={pageOf(query)}
            hasNext={result.nextCursor !== null}
            basePath={canonicalPath({ ...query, cursor: undefined })}
          />
        </>
      )}
    </div>
  );
}
