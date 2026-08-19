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
} from "@/domains/marketplace";
import { Button } from "@/components/ui/button";
import { MarketStat } from "@/domains/marketplace/components/hud/MarketStat";
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
  const [result, totals] = await Promise.all([searchCoaches(query), storefrontTotals()]);
  const filtered = isFiltered(query);

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
        dangerouslySetInnerHTML={jsonLdProps(coachesIndexJsonLd(`${baseUrl}/coaches`, result.total))}
      />

      <section className="relative overflow-hidden border-b border-line-1">
        <span
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(900px 340px at 16% 0%, rgba(198,255,61,0.10), transparent 70%), var(--bg-hero-fade)",
          }}
          aria-hidden
        />
        <span className="bg-scanline absolute inset-0" aria-hidden />

        <div className="relative mx-auto grid max-w-[1240px] items-end gap-8 px-5 pb-8 pt-10 md:px-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div>
            <p className="mb-3.5 flex items-center gap-2.5">
              <span className="h-[7px] w-[7px] animate-pulse bg-accent" aria-hidden />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">
                {"// Every rank here was checked by us"}
              </span>
            </p>
            <h1 className="max-w-[20ch] font-display text-[38px] font-black uppercase leading-[0.96] tracking-[0.02em] text-text md:text-[50px]">
              Find a coach who has the rank they claim
            </h1>
            <p className="mt-4 max-w-[60ch] text-[15.5px] text-text-body">
              Every rank on this page was read from the coach&apos;s own linked Riot account and is
              shown with the date we last checked it. Nobody here typed their rank into a box.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-px border border-border bg-line-1">
            <div className="bg-background p-3.5">
              <MarketStat label="Coaches listed" value={String(totals.coaches)} />
            </div>
            <div className="bg-background p-3.5">
              <MarketStat label="Ranks checked" value={`${checkedPct}%`} tone="accent" />
            </div>
            <div className="bg-background p-3.5">
              <MarketStat label="Sessions run" value={String(totals.sessionsRun)} />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-6 md:px-8">
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
            <div className="mt-4 grid items-start gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
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
      </div>
    </>
  );
}
