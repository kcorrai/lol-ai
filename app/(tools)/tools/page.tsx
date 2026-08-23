import type { Metadata } from "next";
import { getMetaSnapshot, formatGamePatch } from "@/domains/meta";
import { PublicOnly } from "@/components/tools/PublicOnly";
import { TOOL_GROUPS, TOOL_COUNT } from "./toolIndex";
import { ToolsHero } from "./ToolsHero";
import { ToolGroupList } from "./ToolGroupList";
import { ToolsConversion } from "./ToolsConversion";
import { jsonLdProps } from "@/lib/security/jsonLd";

export const metadata: Metadata = {
  title: "Free LoL Tools — Counters, Matchups, Draft & Tier List",
  description:
    "Free League of Legends tools, no login required: counter picker, matchup analyzer, draft analyzer and tier list — all powered by real ranked data, updated every patch.",
  alternates: { canonical: "/tools" },
};

export const revalidate = 43200; // 12h ISR — the hub only moves when the snapshot does.

function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

function hoursAgo(iso: string): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  return Math.max(0, Math.round((Date.now() - then) / 3_600_000));
}

export default async function ToolsHubPage(): Promise<React.JSX.Element> {
  // The hub states four facts about its own data; all four come from the same
  // snapshot the tools themselves are built on, so the page cannot claim a
  // patch or a game count the tier list would disagree with.
  const snapshot = await getMetaSnapshot();
  const updated = snapshot ? `${hoursAgo(snapshot.fetchedAt)}h` : null;
  const patch = snapshot ? formatGamePatch(snapshot.patch) : null;
  const championCount = snapshot?.champions.length ?? 0;

  const heroStats = [
    { label: "Tools", value: String(TOOL_COUNT) },
    ...(snapshot?.matchCount
      ? [{ label: "Games parsed", value: formatCompact(snapshot.matchCount) }]
      : []),
    ...(updated ? [{ label: "Updated", value: updated, unit: "ago" }] : []),
    ...(patch ? [{ label: "Patch", value: patch }] : []),
  ];

  const rowStats = {
    ...(championCount > 0 ? { champions: `${championCount} champions` } : {}),
    ...(patch ? { patch: `Patch ${patch}` } : {}),
    ...(updated ? { updated: `Updated ${updated} ago` } : {}),
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LoL AI Coach Free Tools",
    applicationCategory: "GameApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-16 pt-8 md:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdProps(softwareJsonLd)} />

      <ToolsHero stats={heroStats} />
      <ToolGroupList groups={TOOL_GROUPS} stats={rowStats} />

      <PublicOnly>
        <ToolsConversion />
      </PublicOnly>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-wide text-fg-4">
        Ranked solo/duo unless stated · not endorsed by Riot Games
      </p>
    </div>
  );
}
