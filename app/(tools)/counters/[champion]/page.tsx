import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCounterData, POSITION_LABELS } from "@/domains/meta";
import { CounterResults } from "@/domains/meta/components/CounterResults";
import { fetchAllChampions, fetchChampionDetail } from "@/lib/ddragon/championsData";
import { championSplashUrl } from "@/lib/ddragon";

export const revalidate = 43200; // 12h ISR
export const dynamicParams = true;

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

export async function generateStaticParams(): Promise<{ champion: string }[]> {
  const champions = await fetchAllChampions();
  return champions.map((c) => ({ champion: c.id }));
}

export async function generateMetadata({
  params,
}: {
  params: { champion: string };
}): Promise<Metadata> {
  const detail = await fetchChampionDetail(params.champion);
  if (!detail) return { title: "Champion not found | LoL AI Coach" };
  const data = await getCounterData(detail.id);
  const patch = data ? ` (Patch ${data.patch})` : "";
  return {
    title: `${detail.name} Counters — Best Champions to Beat ${detail.name}${patch} | LoL AI Coach`,
    description: `The best champions to counter ${detail.name} and the matchups ${detail.name} wins, ranked by real ranked win rate. Free counter picks, updated every patch.`,
    alternates: { canonical: `/counters/${detail.id}` },
  };
}

export default async function ChampionCountersPage({
  params,
}: {
  params: { champion: string };
}) {
  const detail = await fetchChampionDetail(params.champion);
  if (!detail) notFound();

  const data = await getCounterData(detail.id);

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
            {data ? ` in ${POSITION_LABELS[data.position]} — Patch ${data.patch}` : ""}, by ranked win rate.
          </p>
        </div>
      </div>

      {data ? (
        <CounterResults
          name={data.name}
          strongAgainstSubject={data.strongAgainstSubject}
          weakAgainstSubject={data.weakAgainstSubject}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-text-muted">
          Counter data for {detail.name} is refreshing. Check back shortly.
        </p>
      )}

      {/* Tips against this champion (from Data Dragon) */}
      {detail.enemytips.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-3 font-display text-lg font-bold text-text">
            How to play against {detail.name}
          </h2>
          <ul className="flex flex-col gap-2">
            {detail.enemytips.slice(0, 4).map((tip, i) => (
              <li key={i} className="flex gap-2 text-sm text-text">
                <span className="mt-0.5 text-accent">▸</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

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
    </div>
  );
}
