import type { Metadata } from "next";
import Link from "next/link";
import { getMatchupData, parsePosition, POSITION_LABELS, formatGamePatch } from "@/domains/meta";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { MatchupControls } from "./MatchupControls";
import { MatchupReportCard } from "./MatchupReportCard";
import { MatchupBuildSummary } from "./MatchupBuildSummary";
import { loadMatchupExtras } from "./loadMatchupExtras";

interface PageProps {
  searchParams: { a?: string; b?: string; role?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const a = searchParams.a?.trim();
  const b = searchParams.b?.trim();
  const title =
    a && b
      ? `${a} vs ${b} Matchup — Win Rate & Lane Tips | LoL AI Coach`
      : "LoL Matchup Analyzer — Champion vs Champion Win Rates | LoL AI Coach";
  const description =
    a && b
      ? `Who wins ${a} vs ${b}? See the real ranked win rate and lane tips for the matchup, updated every patch. Free, no login.`
      : "Compare any two League of Legends champions head-to-head: real ranked win rates and lane tips, updated every patch. Free, no login.";
  return {
    title,
    description,
    alternates: { canonical: "/tools/matchup" },
    // The ?a/?b permalink duplicates the canonical /matchups/[slug] page.
    ...(a && b ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function MatchupPage({ searchParams }: PageProps) {
  const a = searchParams.a?.trim() || null;
  const b = searchParams.b?.trim() || null;
  const requestedPosition = parsePosition(searchParams.role);

  const [report, allChampions] = await Promise.all([
    a && b ? getMatchupData(a, b, requestedPosition ?? undefined) : Promise.resolve(null),
    fetchAllChampions(),
  ]);
  const extras = report
    ? await loadMatchupExtras(report.championA.key, report.championB.key, report.position)
    : null;
  const championOptions = allChampions
    .map((c) => ({ key: c.id, name: c.name }))
    .sort((x, y) => x.name.localeCompare(y.name));

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <ToolBreadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Matchup Analyzer", href: "/tools/matchup" },
        ]}
      />

      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          Matchup Analyzer
        </h1>
        <p className="mt-2 text-text-muted">
          Compare two champions head-to-head and see who wins the lane, by real ranked win rate.
        </p>
      </header>

      <div className="mb-10 rounded-2xl border border-border bg-surface/60 p-5">
        <MatchupControls
          champions={championOptions}
          championA={report?.championA.key ?? a}
          championB={report?.championB.key ?? b}
          position={report?.position ?? requestedPosition}
          availablePositions={report ? [report.position] : []}
        />
      </div>

      {(!a || !b) && (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          Pick two champions above to compare the matchup.
        </p>
      )}

      {a && b && !report && (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          No ranked data available for this matchup right now. Try different champions.
        </p>
      )}

      {report && (
        <>
          <div className="mb-6 flex items-center gap-2 text-sm text-text-muted">
            <span className="rounded-full bg-surface-2 px-3 py-1 font-semibold text-text">
              {POSITION_LABELS[report.position]}
            </span>
            <span>Patch {formatGamePatch(report.patch)}</span>
          </div>

          <MatchupReportCard report={report} />

          {extras && (
            <MatchupBuildSummary
              nameA={report.championA.name}
              nameB={report.championB.name}
              extras={extras}
            />
          )}

          <div className="mt-6 text-center">
            <Link
              href={`/matchups/${[report.championA.key.toLowerCase(), report.championB.key.toLowerCase()].sort().join("-vs-")}`}
              className="inline-block rounded-md border border-border px-5 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-accent/50 hover:text-text"
            >
              Full {report.championA.name} vs {report.championB.name} guide →
            </Link>
          </div>

          <div className="mt-8 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
            <h2 className="font-display text-xl font-bold text-text">
              Struggling with this lane in your own games?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
              Connect your Riot account for a personal AI coaching report that breaks down your
              real matchups, mistakes, and how to climb.
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
    </div>
  );
}
