import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { parseMatchupSlug, getMatchupPairs } from "@/domains/meta";
import { loadMatchupData } from "@/domains/meta/components/matchup/loadMatchupData";
import { MatchupPageView } from "@/domains/meta/components/matchup/MatchupPageView";

export const revalidate = 43200; // 12h ISR
export const dynamicParams = true;

// Prerender the ~200 highest-signal pairs; the rest render on demand (ISR).
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const pairs = await getMatchupPairs(200);
  return pairs.map((p) => ({ slug: `${p.a.toLowerCase()}-vs-${p.b.toLowerCase()}` }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const parsed = parseMatchupSlug(params.slug);
  if (!parsed) return { title: "Matchup not found" };
  const data = await loadMatchupData(parsed.first, parsed.second);
  if (!data) return { title: "Matchup not found" };
  return {
    title: `${data.a.name} vs ${data.b.name} — ${data.laneLabel} Matchup & Win Rate (Patch ${data.gamePatch})`,
    description: `Who wins ${data.a.name} vs ${data.b.name}? Real ranked win rate, scaling comparison and lane tips for the ${data.laneLabel} matchup on patch ${data.gamePatch}. Free, updated every patch.`,
    alternates: { canonical: `/matchups/${parsed.canonical}` },
  };
}

export default async function MatchupPage({ params }: { params: { slug: string } }) {
  const parsed = parseMatchupSlug(params.slug);
  if (!parsed) notFound();
  // Enforce the alphabetical canonical URL (308 permanent for SEO).
  if (params.slug.toLowerCase() !== parsed.canonical)
    permanentRedirect(`/matchups/${parsed.canonical}`);

  const data = await loadMatchupData(parsed.first, parsed.second);
  if (!data) notFound();
  return <MatchupPageView d={data} />;
}
