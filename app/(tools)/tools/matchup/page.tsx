import type { Metadata } from "next";
import Link from "next/link";
import { getMatchupData, parsePosition, POSITION_LABELS, formatGamePatch } from "@/domains/meta";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { MatchupControls } from "./MatchupControls";
import { MatchupReportCard } from "./MatchupReportCard";
import { MatchupBuildSummary } from "./MatchupBuildSummary";
import { loadMatchupExtras } from "./loadMatchupExtras";
import { ToolUpgradeNudge } from "../../ToolUpgradeNudge";
import { ToolHeader } from "../../ToolHeader";
import { ToolEmpty } from "../../ToolEmpty";
import { ToolCta } from "../../ToolCta";
import { LiveGameButton } from "@/components/tools/LiveGameButton";

interface PageProps {
  searchParams: { a?: string; b?: string; role?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const a = searchParams.a?.trim();
  const b = searchParams.b?.trim();
  // The root layout template appends " | LaneIQ"; repeating it here put the name in
  // the tab twice.
  const title =
    a && b
      ? `${a} vs ${b} Matchup — Win Rate & Lane Tips`
      : "LoL Matchup Analyzer — Champion vs Champion Win Rates";
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
    <div className="mx-auto max-w-[1100px] px-5 py-12 md:px-8">
      <Breadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Matchup Analyzer", href: "/tools/matchup" },
        ]}
      />

      <ToolHeader
        title="Matchup Analyzer"
        subtitle="Compare two champions head-to-head and see who wins the lane, by real ranked win rate."
      />

      <LiveGameButton mode="matchup" />

      <div className="notch mb-10 border border-border bg-surface px-4 py-4">
        <MatchupControls
          champions={championOptions}
          championA={report?.championA.key ?? a}
          championB={report?.championB.key ?? b}
          position={report?.position ?? requestedPosition}
          availablePositions={report?.availablePositions ?? []}
        />
      </div>

      {(!a || !b) && (
        <ToolEmpty
          title="Pick two champions"
          body="Your champion on the left, the one you are laning against on the right."
        />
      )}

      {a && b && !report && (
        <ToolEmpty
          title="No ranked data for this matchup"
          body="There is no sample for this pairing right now. Try different champions."
        />
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

          <ToolUpgradeNudge message="Go Pro to see this matchup in YOUR games — your real win rate in the lane, the mistakes costing you, and a plan to win it." />

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

          <ToolCta
            eyebrow="The average lane is not your lane"
            title="Struggling with this lane in your own games?"
            body="Connect your Riot account for a personal AI coaching report that breaks down your real matchups, mistakes, and how to climb."
            splashKey={report.championB.key}
          />
        </>
      )}
    </div>
  );
}
