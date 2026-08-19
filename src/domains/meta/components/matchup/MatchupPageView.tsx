import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { MatchupCurveCompare } from "@/domains/meta/components/MatchupCurveCompare";
import { DataFreshness } from "@/domains/meta/components/DataFreshness";
import type { MatchupPageData } from "./loadMatchupData";
import { jsonLdProps } from "@/lib/security/jsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://lolaicoach.gg";

function analysis(d: MatchupPageData): string {
  const verdictWord =
    d.verdict === "favored" ? "favourable" : d.verdict === "unfavored" ? "difficult" : "even";
  const parts = [
    `${d.a.name} vs ${d.b.name} in ${d.laneLabel} is a ${verdictWord} matchup for ${d.a.name} on patch ${d.gamePatch}.`,
  ];
  if (d.games > 0) {
    parts.push(
      `Across ${d.games.toLocaleString()} ranked games, ${d.a.name} wins ${d.aWinRate.toFixed(1)}% of the time.`
    );
  } else {
    parts.push(`There isn't a large ranked sample for this exact matchup yet, so play to your win conditions.`);
  }
  const lateA = d.curveA.find((p) => p.minutes === 40)?.winRate;
  const lateB = d.curveB.find((p) => p.minutes === 40)?.winRate;
  if (lateA !== undefined && lateB !== undefined) {
    if (lateA >= lateB + 1) parts.push(`${d.a.name} scales better into the late game, so ${d.b.name} should look to end early.`);
    else if (lateB >= lateA + 1) parts.push(`${d.b.name} out-scales ${d.a.name}, so ${d.a.name} wants to press its lead before 40 minutes.`);
    else parts.push(`Both champions scale similarly, so the lane is decided by early trades and roams.`);
  }
  if (d.coreA.length > 0) parts.push(`${d.a.name} typically builds ${d.coreA.join(", ")}.`);
  if (d.coreB.length > 0) parts.push(`${d.b.name} rushes ${d.coreB.join(", ")}.`);
  return parts.join(" ");
}

export function MatchupPageView({ d }: { d: MatchupPageData }) {
  const good = d.aWinRate >= 52;
  const bad = d.aWinRate <= 48;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    dateModified: d.fetchedAt,
    mainEntity: [
      {
        "@type": "Question",
        name: `Who wins ${d.a.name} vs ${d.b.name}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: d.games > 0
            ? `${d.a.name} wins ${d.aWinRate.toFixed(1)}% of ${d.laneLabel} games against ${d.b.name} on patch ${d.gamePatch}.`
            : `The ${d.a.name} vs ${d.b.name} matchup is close to even by ranked win rate this patch.`,
        },
      },
    ],
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Free Tools", item: `${BASE_URL}/tools` },
      { "@type": "ListItem", position: 2, name: "Matchups", item: `${BASE_URL}/tools/matchup` },
      { "@type": "ListItem", position: 3, name: `${d.a.name} vs ${d.b.name}`, item: `${BASE_URL}/matchups/${d.a.key.toLowerCase()}-vs-${d.b.key.toLowerCase()}` },
    ],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(jsonLd)} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(breadcrumb)} />

      <Breadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Matchups", href: "/tools/matchup" },
          { name: `${d.a.name} vs ${d.b.name}`, href: `/matchups/${d.a.key.toLowerCase()}-vs-${d.b.key.toLowerCase()}` },
        ]}
      />

      <header className="mb-4">
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">
          {d.a.name} vs {d.b.name} — {d.laneLabel} Matchup, Patch {d.gamePatch}
        </h1>
      </header>

      <DataFreshness fetchedAt={d.fetchedAt} patch={d.rawPatch} matchCount={d.matchCount} className="mb-6" />

      {/* Head-to-head card */}
      <div className="mb-8 flex items-center justify-center gap-6 rounded-2xl border border-border bg-surface/60 p-6">
        <div className="flex flex-col items-center gap-2">
          <ChampionIcon name={d.a.key} size={64} />
          <span className="text-sm font-semibold text-text">{d.a.name}</span>
        </div>
        <div className="text-center">
          <div className={`font-display text-4xl font-black ${good ? "text-success" : bad ? "text-danger" : "text-text"}`}>
            {d.aWinRate.toFixed(1)}%
          </div>
          <div className="text-xs text-text-muted">{d.a.name} win rate</div>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ChampionIcon name={d.b.key} size={64} />
          <span className="text-sm font-semibold text-text">{d.b.name}</span>
        </div>
      </div>

      <p className="mb-8 leading-relaxed text-text-muted">{analysis(d)}</p>

      <div className="grid gap-5 md:grid-cols-2">
        <MatchupCurveCompare nameA={d.a.name} nameB={d.b.name} curveA={d.curveA} curveB={d.curveB} />
        {d.hints.length > 0 && (
          <div className="rounded-2xl border border-border bg-surface/60 p-5">
            <h2 className="mb-3 font-display text-lg font-bold text-text">Lane Tips</h2>
            <ul className="flex flex-col gap-2">
              {d.hints.map((h, i) => (
                <li key={i} className="flex gap-2 text-sm text-text">
                  <span className="mt-0.5 text-accent">▸</span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Internal links */}
      <div className="mt-10 flex flex-wrap gap-3 text-sm">
        {[d.a, d.b].map((c) => (
          <Link key={c.key} href={`/builds/${c.key}`} className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text">
            {c.name} build →
          </Link>
        ))}
        {[d.a, d.b].map((c) => (
          <Link key={`${c.key}-c`} href={`/counters/${c.key}`} className="rounded-lg border border-border bg-surface px-4 py-2 text-text-muted hover:border-accent/40 hover:text-text">
            {c.name} counters →
          </Link>
        ))}
      </div>
    </div>
  );
}
