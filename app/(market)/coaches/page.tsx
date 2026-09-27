import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchX } from "lucide-react";
import {
  searchCoaches,
  sortPageByPrice,
  parseSearchQuery,
  canonicalPath,
  isFiltered,
  pageOf,
  storefrontTotals,
  compareRanks,
  newCoaches,
} from "@/domains/marketplace";
import type { CoachCard } from "@/domains/marketplace/types";
import { Button } from "@/components/ui/button";
import { GoalCarrier } from "@/domains/marketplace/components/GoalCarrier";
import {
  CoachOnLaneIq,
  HowItWorks,
  NewCoachesStrip,
} from "@/domains/marketplace/components/StorefrontSections";
import { StorefrontHero } from "@/domains/marketplace/components/StorefrontHero";
import { CoachCardTile } from "@/domains/marketplace/components/CoachCardTile";
import { CoachFilters } from "@/domains/marketplace/components/CoachFilters";
import { CoachPagination } from "@/domains/marketplace/components/CoachPagination";
import { coachesIndexJsonLd } from "@/domains/marketplace/jsonLd";
import { jsonLdProps } from "@/lib/security/jsonLd";

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
  const filtered = isFiltered(query);
  const firstPage = !filtered && pageOf(query) === 1;
  const [result, totals, fresh] = await Promise.all([
    searchCoaches(query),
    storefrontTotals(),
    firstPage ? newCoaches(3) : Promise.resolve([]),
  ]);

  const coaches =
    query.sort === "price_asc"
      ? sortPageByPrice(result.coaches, "asc")
      : query.sort === "price_desc"
        ? sortPageByPrice(result.coaches, "desc")
        : result.coaches;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";
  const checkedPct =
    totals.coaches === 0 ? 100 : Math.round((totals.ranksChecked / totals.coaches) * 100);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={jsonLdProps(
          coachesIndexJsonLd(`${baseUrl}/coaches`, result.total)
        )}
      />

      <StorefrontHero
        coaches={totals.coaches}
        checkedPct={checkedPct}
        sessionsRun={totals.sessionsRun}
        tiers={heroTiers(coaches)}
      />

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
        <Suspense>
          <GoalCarrier />
        </Suspense>
        <Suspense fallback={<div className="notch h-40 border border-border bg-surface" />}>
          <CoachFilters filtered={filtered} total={result.total} />
        </Suspense>

        {coaches.length === 0 ? (
          <section className="notch-lg bg-hero-fade relative mt-4 overflow-hidden border border-border bg-surface px-8 py-14 text-center">
            <span
              className="notch-sm mb-4 inline-flex h-[52px] w-[52px] items-center justify-center border border-line-2 text-text-muted"
              aria-hidden
            >
              <SearchX className="h-6 w-6" />
            </span>
            <h2 className="font-display text-[26px] font-extrabold uppercase tracking-[0.03em] text-text">
              {filtered ? "No coach matches that" : "No coaches yet"}
            </h2>
            <p className="mx-auto mt-3 max-w-[46ch] text-[14.5px] text-text-body">
              {filtered
                ? "Rank and price narrow this the fastest. Widen one of them and the list comes back."
                : "The first coaches are being reviewed. If you coach, this is a good moment to apply."}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2.5">
              {filtered ? (
                <>
                  <Button asChild>
                    <Link href="/coaches">Clear filters</Link>
                  </Button>
                  <Button asChild variant="ghost">
                    <Link href={canonicalPath({ ...query, role: undefined, cursor: undefined })}>
                      Show every role
                    </Link>
                  </Button>
                </>
              ) : (
                <Button asChild>
                  <Link href="/coach/apply">Become a coach</Link>
                </Button>
              )}
            </div>
          </section>
        ) : (
          <>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {coaches.map((coach, i) => (
                <CoachCardTile
                  key={coach.slug}
                  coach={coach}
                  featured={i === 0 && !filtered && pageOf(query) === 1}
                />
              ))}
            </div>

            <CoachPagination
              page={pageOf(query)}
              hasNext={result.nextCursor !== null}
              basePath={canonicalPath({ ...query, cursor: undefined })}
            />
          </>
        )}

        {/* New coaches already on this page are not shown twice. */}
        <NewCoachesStrip
          coaches={fresh.filter((c) => !coaches.some((shown) => shown.slug === c.slug))}
        />
        {firstPage && <HowItWorks />}
        <CoachOnLaneIq />
      </div>
    </>
  );
}

/** The distinct tiers on this page, highest first, capped at the three the hero can draw. */
function heroTiers(coaches: CoachCard[]): string[] {
  const badges = coaches
    .map((c) => c.badge)
    .filter((b): b is NonNullable<CoachCard["badge"]> => b !== null)
    .sort((a, b) => compareRanks(b, a));
  return Array.from(new Set(badges.map((b) => b.tier))).slice(0, 3);
}
