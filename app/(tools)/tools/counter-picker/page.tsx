import type { Metadata } from "next";
import Link from "next/link";
import { getCounterData, getPopularChampions, parsePosition, POSITION_LABELS, formatGamePatch } from "@/domains/meta";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { CounterResults } from "@/domains/meta/components/CounterResults";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { RelatedChampions } from "@/domains/meta/components/RelatedChampions";
import { CounterPickerControls } from "./CounterPickerControls";

interface PageProps {
  searchParams: { champion?: string; role?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const champion = searchParams.champion?.trim();
  const title = champion
    ? `${champion} Counters — Best & Worst Matchups | LoL AI Coach`
    : "LoL Counter Picker — Champion Counters by Win Rate | LoL AI Coach";
  const description = champion
    ? `See the best champions to counter ${champion} and the matchups ${champion} beats, ranked by real ranked win rate. Free, updated every patch.`
    : "Find the best counter picks for any League of Legends champion, ranked by real ranked win rate. Free, no login, updated every patch.";
  return {
    title,
    description,
    alternates: { canonical: "/tools/counter-picker" },
  };
}

export default async function CounterPickerPage({ searchParams }: PageProps) {
  const champion = searchParams.champion?.trim() || null;
  const requestedPosition = parsePosition(searchParams.role);
  const [result, allChampions, popular] = await Promise.all([
    champion ? getCounterData(champion, requestedPosition ?? undefined) : Promise.resolve(null),
    fetchAllChampions(),
    getPopularChampions(10, champion ?? undefined),
  ]);
  const championOptions = allChampions
    .map((c) => ({ key: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How are counter picks calculated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Counters are ranked by real ranked win rate across millions of games this patch. A champion with a high win rate against another is a strong counter to it.",
        },
      },
      {
        "@type": "Question",
        name: "How often is the counter data updated?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Win rates refresh at least twice a day from live ranked data, so the counters always reflect the current patch.",
        },
      },
    ],
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <ToolBreadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Counter Picker", href: "/tools/counter-picker" },
        ]}
      />

      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          Counter Picker
        </h1>
        <p className="mt-2 max-w-2xl text-text-muted">
          Pick a champion to see who counters it and which matchups it wins, ranked by real
          ranked win rate.
        </p>
      </header>

      <div className="mb-10 rounded-2xl border border-border bg-surface/60 p-5">
        <CounterPickerControls
          champions={championOptions}
          champion={result?.championKey ?? champion}
          position={result?.position ?? requestedPosition}
          availablePositions={result?.availablePositions ?? []}
        />
      </div>

      {!champion && (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          Select a champion above to see its counters.
        </p>
      )}

      {champion && !result && (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          No ranked data available for <span className="font-semibold text-text">{champion}</span>{" "}
          right now. Try another champion.
        </p>
      )}

      {result && (
        <>
          <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
            <span className="rounded-full bg-surface-2 px-3 py-1 font-semibold text-text">
              {POSITION_LABELS[result.position]}
            </span>
            <span>Patch {formatGamePatch(result.patch)}</span>
          </div>

          <CounterResults
            name={result.name}
            strongAgainstSubject={result.strongAgainstSubject}
            weakAgainstSubject={result.weakAgainstSubject}
            subjectKey={result.championKey}
          />

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            <Link
              href={`/counters/${result.championKey}`}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text"
            >
              View the full {result.name} counter guide →
            </Link>
            <Link
              href={`/builds/${result.championKey}`}
              className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text"
            >
              {result.name} build &amp; runes →
            </Link>
          </div>

          <div className="mt-12 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
            <h2 className="font-display text-xl font-bold text-text">
              Want to know why you keep losing this matchup?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
              Connect your Riot account and get a personal AI coaching report on your own games —
              your worst matchups, mistakes, and how to fix them.
            </p>
            <Link
              href="/register"
              className="mt-5 inline-block rounded-md bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90"
            >
              Get your free AI analysis
            </Link>
          </div>
        </>
      )}

      <RelatedChampions title="Popular this patch" champions={popular} />
    </div>
  );
}
