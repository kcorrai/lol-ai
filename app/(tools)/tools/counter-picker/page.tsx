import type { Metadata } from "next";
import Link from "next/link";
import {
  getCounterData,
  getPopularChampions,
  parsePosition,
  parseTier,
  POSITION_LABELS,
  formatGamePatch,
} from "@/domains/meta";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { CounterResults } from "@/domains/meta/components/CounterResults";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { RelatedChampions } from "@/domains/meta/components/RelatedChampions";
import { PersonalMatchupPanel } from "@/domains/counter/components/PersonalMatchupPanel";
import { CounterPickerControls } from "./CounterPickerControls";
import { ToolHeader } from "../../ToolHeader";
import { ToolEmpty } from "../../ToolEmpty";
import { ToolCta } from "../../ToolCta";
import { HUD_LINK } from "../../hudChip";
import { PopularPickGrid } from "./PopularPickGrid";
import { CounterSubject } from "@/domains/meta/components/CounterSubject";
import { jsonLdProps } from "@/lib/security/jsonLd";

interface PageProps {
  searchParams: { champion?: string; role?: string; tier?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const champion = searchParams.champion?.trim();
  // The root layout template appends " | LaneIQ"; repeating it here put the name in
  // the tab twice.
  const title = champion
    ? `${champion} Counters — Best & Worst Matchups`
    : "LoL Counter Picker — Champion Counters by Win Rate";
  const description = champion
    ? `See the best champions to counter ${champion} and the matchups ${champion} beats, ranked by real ranked win rate. Free, updated every patch.`
    : "Find the best counter picks for any League of Legends champion, ranked by real ranked win rate. Free, no login, updated every patch.";
  return {
    title,
    description,
    alternates: { canonical: "/tools/counter-picker" },
    // The ?champion permalink duplicates the canonical /counters/[champion] SSG
    // page — keep the query variant out of the index.
    ...(champion ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function CounterPickerPage({ searchParams }: PageProps) {
  const champion = searchParams.champion?.trim() || null;
  const requestedPosition = parsePosition(searchParams.role);
  const requestedTier = parseTier(searchParams.tier);
  const [result, allChampions, popular] = await Promise.all([
    champion
      ? getCounterData(champion, requestedPosition ?? undefined, requestedTier ?? undefined)
      : Promise.resolve(null),
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
    <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(faqJsonLd)} />

      <Breadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Counter Picker", href: "/tools/counter-picker" },
        ]}
      />

      <ToolHeader
        title="Counter Picker"
        subtitle="Pick a champion to see who counters it and which matchups it wins, ranked by real ranked win rate."
      />

      <div className="notch mb-10 border border-border bg-surface px-4 py-4">
        <CounterPickerControls
          champions={championOptions}
          champion={result?.championKey ?? champion}
          position={result?.position ?? requestedPosition}
          availablePositions={result?.availablePositions ?? []}
          tier={requestedTier}
        />
      </div>

      {!champion && (
        <ToolEmpty
          title="Pick a champion"
          body="Choose the champion you are laning against to see who beats it, and who it beats."
        >
          <PopularPickGrid champions={popular} />
        </ToolEmpty>
      )}

      {champion && !result && (
        <ToolEmpty
          title={`No ranked data for ${champion}`}
          body="There is no sample for this champion right now. Try another champion."
        />
      )}

      {result && (
        <>
          <CounterSubject
            championKey={result.championKey}
            name={result.name}
            laneLabel={POSITION_LABELS[result.position]}
            gamePatch={formatGamePatch(result.patch)}
            stats={result.stats}
            heading="h2"
            title={`${result.name} counters`}
          />

          <CounterResults
            name={result.name}
            strongAgainstSubject={result.strongAgainstSubject}
            weakAgainstSubject={result.weakAgainstSubject}
            subjectKey={result.championKey}
          />

          <PersonalMatchupPanel championId={result.championId} championName={result.name} />

          <div className="mt-8 flex flex-wrap gap-2.5">
            <Link href={`/counters/${result.championKey}`} className={HUD_LINK}>
              View the full {result.name} counter guide →
            </Link>
            <Link href={`/builds/${result.championKey}`} className={HUD_LINK}>
              {result.name} build &amp; runes →
            </Link>
          </div>

          <ToolCta
            eyebrow="Counters are the average player"
            title="Want to know why you keep losing this matchup?"
            body="Connect your Riot account and get a personal AI coaching report on your own games — your worst matchups, mistakes, and how to fix them."
            splashKey={result.championKey}
          />
        </>
      )}

      {champion && <RelatedChampions title="Popular this patch" champions={popular} />}
    </div>
  );
}
