import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getCounterData,
  getMetaSnapshot,
  getPopularChampions,
  parsePosition,
  parseTier,
  POSITION_LABELS,
  SNAPSHOT_TIERS,
  TIER_LABELS,
  formatGamePatch,
} from "@/domains/meta";
import type { CanonicalPosition, SnapshotTier } from "@/domains/meta";
import { CounterResults } from "@/domains/meta/components/CounterResults";
import { RelatedChampions } from "@/domains/meta/components/RelatedChampions";
import { DataFreshness } from "@/domains/meta/components/DataFreshness";
import { CounterInsights } from "./CounterInsights";
import { CounterSubject } from "@/domains/meta/components/CounterSubject";
import { HUD_LINK, hudChip } from "../../hudChip";
import { ProPlayStrip } from "@/domains/esports/components/ProPlayStrip";
import { fetchChampionDetail } from "@/lib/ddragon/championsData";
import { jsonLdProps } from "@/lib/security/jsonLd";

export const revalidate = 43200; // 12h ISR
// Static: filtered requests never reach this route — middleware rewrites them onto the cacheable
// copy under `f/` (ADR-061) — so the search params it still reads are always empty here.
export const dynamic = "force-static";
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

// Prerender the ~50 most-picked champions; the rest render on demand (ISR), which is the
// discipline /builds and /aram already follow. This route used to build every champion in
// the game, and `dynamicParams` above has always been true, so nothing becomes unreachable
// and no URL leaves the sitemap — the tail is simply built by the first reader who wants it
// rather than by every deploy. An unavailable snapshot builds none of them rather than
// costing the build a round of cold renders.
export async function generateStaticParams(): Promise<{ champion: string }[]> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return [];
  return [...snapshot.champions]
    .sort((a, b) => b.overallPickRate - a.overallPickRate)
    .slice(0, 50)
    .map((c) => ({ champion: c.championKey }));
}

interface PageProps {
  params: { champion: string };
  searchParams: { tier?: string; role?: string };
}

// Builds a /counters/[champion] URL preserving the other active filter.
function counterHref(
  championKey: string,
  role: CanonicalPosition | null,
  tier: SnapshotTier | null
): string {
  const params = new URLSearchParams();
  if (role) params.set("role", role);
  if (tier) params.set("tier", tier);
  const query = params.toString();
  return `/counters/${championKey}${query ? `?${query}` : ""}`;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const detail = await fetchChampionDetail(params.champion);
  if (!detail) return { title: "Champion not found" };
  const data = await getCounterData(detail.id);
  const patch = data ? ` (Patch ${formatGamePatch(data.patch)})` : "";
  // Rank/lane-filtered views are near-duplicates — keep them out of the index.
  const filtered = Boolean(parseTier(searchParams.tier) || parsePosition(searchParams.role));
  return {
    title: `${detail.name} Counters — Best Champions to Beat ${detail.name}${patch}`,
    description: `The best champions to counter ${detail.name} and the matchups ${detail.name} wins, ranked by real ranked win rate. Free counter picks, updated every patch.`,
    alternates: { canonical: `/counters/${detail.id}` },
    ...(filtered ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ChampionCountersPage({ params, searchParams }: PageProps) {
  const detail = await fetchChampionDetail(params.champion);
  if (!detail) notFound();

  const tier = parseTier(searchParams.tier);
  const requestedPosition = parsePosition(searchParams.role);
  const [data, popular] = await Promise.all([
    getCounterData(detail.id, requestedPosition ?? undefined, tier ?? undefined),
    getPopularChampions(10, detail.id),
  ]);

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Free Tools", item: `${BASE_URL}/tools` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Counters",
        item: `${BASE_URL}/tools/counter-picker`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${detail.name} Counters`,
        item: `${BASE_URL}/counters/${detail.id}`,
      },
    ],
  };
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(data ? { dateModified: data.fetchedAt } : {}),
    mainEntity: [
      {
        "@type": "Question",
        name: `Who counters ${detail.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text:
            data && data.strongAgainstSubject.length > 0
              ? `${data.strongAgainstSubject
                  .slice(0, 3)
                  .map((c) => c.name)
                  .join(
                    ", "
                  )} are among the strongest counters to ${detail.name} this patch, based on ranked win rate.`
              : `Counter picks for ${detail.name} are ranked by real ranked win rate and updated every patch.`,
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(breadcrumbJsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(faqJsonLd)} />

      <nav className="mb-6 text-xs text-text-muted">
        <Link href="/tools" className="hover:text-text">
          Free Tools
        </Link>
        <span className="mx-1.5">/</span>
        <Link href="/tools/counter-picker" className="hover:text-text">
          Counters
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-text">{detail.name}</span>
      </nav>

      {/* Hero */}
      {data ? (
        <CounterSubject
          championKey={data.championKey}
          name={detail.name}
          laneLabel={POSITION_LABELS[data.position]}
          gamePatch={formatGamePatch(data.patch)}
          stats={data.stats}
          heading="h1"
          title={`${detail.name} Counters`}
        />
      ) : (
        <h1 className="mb-6 font-display text-[34px] font-black uppercase leading-[0.98] tracking-[0.02em] text-text md:text-[44px]">
          {detail.name} Counters
        </h1>
      )}

      <div className="notch mb-6 grid gap-3 border border-border bg-surface px-4 py-3.5">
        {/* Lane filter — only when the champion plays more than one lane */}
        {data && data.availablePositions.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="hud-label mr-1 w-10 text-[10px]">Lane</span>
            {data.availablePositions.map((pos) => (
              <Link
                key={pos}
                href={counterHref(detail.id, pos, tier)}
                className={hudChip(pos === data.position)}
              >
                {POSITION_LABELS[pos]}
              </Link>
            ))}
          </div>
        )}

        {/* Rank bracket filter */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="hud-label mr-1 w-10 text-[10px]">Rank</span>
          <Link
            href={counterHref(detail.id, requestedPosition, null)}
            className={hudChip(tier === null)}
          >
            Default
          </Link>
          {SNAPSHOT_TIERS.map((t) => (
            <Link
              key={t}
              href={counterHref(detail.id, requestedPosition, t)}
              className={hudChip(t === tier)}
            >
              {TIER_LABELS[t]}
            </Link>
          ))}
        </div>
      </div>

      {data && (
        <DataFreshness
          fetchedAt={data.fetchedAt}
          patch={data.patch}
          matchCount={data.matchCount}
          className="mb-6"
        />
      )}

      {data ? (
        <CounterResults
          name={data.name}
          strongAgainstSubject={data.strongAgainstSubject}
          weakAgainstSubject={data.weakAgainstSubject}
          subjectKey={data.championKey}
        />
      ) : (
        <p className="notch border border-border bg-surface px-4 py-10 text-center text-text-muted">
          Counter data for {detail.name} is refreshing. Check back shortly.
        </p>
      )}

      {/* Data-rich how-to-play block with game-length curve, trend and build link */}
      {data && (
        <CounterInsights
          data={data}
          laneLabel={POSITION_LABELS[data.position]}
          gamePatch={formatGamePatch(data.patch)}
          enemyTips={detail.enemytips}
        />
      )}

      {/* One line only: this page is about who beats whom, and the pro angle is
          a pointer, not a section. */}
      <div className="mt-12">
        <ProPlayStrip championId={detail.id} name={detail.name} variant="line" />
      </div>

      {/* Internal links */}
      <div className="mt-12 flex flex-wrap gap-2.5">
        <Link href={`/tools/counter-picker?champion=${detail.id}`} className={HUD_LINK}>
          Explore {detail.name} in the counter picker →
        </Link>
        <Link href={`/champions/${detail.id}`} className={HUD_LINK}>
          {detail.name} champion guide →
        </Link>
        <Link href="/tools/tier-list" className={HUD_LINK}>
          Current tier list →
        </Link>
      </div>

      <RelatedChampions title="More counter guides" champions={popular} />
    </div>
  );
}
