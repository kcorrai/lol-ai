import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getCounterData,
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
import { ProPlayStrip } from "@/domains/esports/components/ProPlayStrip";
import { fetchAllChampions, fetchChampionDetail } from "@/lib/ddragon/championsData";
import { championSplashUrl } from "@/lib/ddragon";

export const revalidate = 43200; // 12h ISR
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

export async function generateStaticParams(): Promise<{ champion: string }[]> {
  const champions = await fetchAllChampions();
  return champions.map((c) => ({ champion: c.id }));
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
  if (!detail) return { title: "Champion not found | LoL AI Coach" };
  const data = await getCounterData(detail.id);
  const patch = data ? ` (Patch ${formatGamePatch(data.patch)})` : "";
  // Rank/lane-filtered views are near-duplicates — keep them out of the index.
  const filtered = Boolean(parseTier(searchParams.tier) || parsePosition(searchParams.role));
  return {
    title: `${detail.name} Counters — Best Champions to Beat ${detail.name}${patch} | LoL AI Coach`,
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
      { "@type": "ListItem", position: 2, name: "Counters", item: `${BASE_URL}/tools/counter-picker` },
      { "@type": "ListItem", position: 3, name: `${detail.name} Counters`, item: `${BASE_URL}/counters/${detail.id}` },
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
          text: data && data.strongAgainstSubject.length > 0
            ? `${data.strongAgainstSubject.slice(0, 3).map((c) => c.name).join(", ")} are among the strongest counters to ${detail.name} this patch, based on ranked win rate.`
            : `Counter picks for ${detail.name} are ranked by real ranked win rate and updated every patch.`,
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <nav className="mb-6 text-xs text-text-muted">
        <Link href="/tools" className="hover:text-text">Free Tools</Link>
        <span className="mx-1.5">/</span>
        <Link href="/tools/counter-picker" className="hover:text-text">Counters</Link>
        <span className="mx-1.5">/</span>
        <span className="text-text">{detail.name}</span>
      </nav>

      {/* Hero */}
      <div className="relative mb-10 overflow-hidden rounded-2xl border border-border">
        <Image
          src={championSplashUrl(detail.id)}
          alt={`${detail.name} splash art`}
          width={1215}
          height={340}
          className="h-48 w-full object-cover object-top md:h-64"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute bottom-0 p-6">
          <h1 className="font-display text-3xl font-black text-text md:text-4xl">
            {detail.name} Counters
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-text-muted">
            Best champions to beat {detail.name}
            {data ? ` in ${POSITION_LABELS[data.position]} — Patch ${formatGamePatch(data.patch)}` : ""}, by ranked win rate.
          </p>
        </div>
      </div>

      {/* Lane filter — only when the champion plays more than one lane */}
      {data && data.availablePositions.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-[11px] uppercase tracking-wide text-text-muted">Lane</span>
          {data.availablePositions.map((pos) => (
            <Link
              key={pos}
              href={counterHref(detail.id, pos, tier)}
              className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
                pos === data.position
                  ? "bg-accent text-background"
                  : "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
              }`}
            >
              {POSITION_LABELS[pos]}
            </Link>
          ))}
        </div>
      )}

      {/* Rank bracket filter */}
      <div className="mb-6 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[11px] uppercase tracking-wide text-text-muted">Rank</span>
        <Link
          href={counterHref(detail.id, requestedPosition, null)}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            tier === null
              ? "bg-accent text-background"
              : "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
          }`}
        >
          Default
        </Link>
        {SNAPSHOT_TIERS.map((t) => (
          <Link
            key={t}
            href={counterHref(detail.id, requestedPosition, t)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
              t === tier
                ? "bg-accent text-background"
                : "border border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
            }`}
          >
            {TIER_LABELS[t]}
          </Link>
        ))}
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
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-text-muted">
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
      <div className="mt-12 flex flex-wrap gap-3 text-sm">
        <Link href={`/tools/counter-picker?champion=${detail.id}`} className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text">
          Explore {detail.name} in the counter picker →
        </Link>
        <Link href={`/champions/${detail.id}`} className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text">
          {detail.name} champion guide →
        </Link>
        <Link href="/tools/tier-list" className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text">
          Current tier list →
        </Link>
      </div>

      <RelatedChampions title="More counter guides" champions={popular} />
    </div>
  );
}
