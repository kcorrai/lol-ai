import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMetaSnapshot, POSITION_LABELS } from "@/domains/meta";
import { BuildView } from "@/domains/meta/components/build/BuildView";
import { ProPlayStrip } from "@/domains/esports/components/ProPlayStrip";
import { loadBuildData } from "@/domains/meta/components/build/loadBuildData";

export const revalidate = 43200; // 12h ISR
export const dynamicParams = true;

// Prerender the ~50 most-picked champions; the rest render on demand (ISR).
export async function generateStaticParams(): Promise<{ champion: string }[]> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return [];
  return [...snapshot.champions]
    .sort((a, b) => b.overallPickRate - a.overallPickRate)
    .slice(0, 50)
    .map((c) => ({ champion: c.championKey }));
}

export async function generateMetadata({
  params,
}: {
  params: { champion: string };
}): Promise<Metadata> {
  const data = await loadBuildData(params.champion);
  if (!data) return { title: "Champion build not found | LoL AI Coach" };
  const lane = POSITION_LABELS[data.position];
  return {
    title: `${data.name} Build, Runes & Skill Order — ${lane} Patch ${data.gamePatch} | LoL AI Coach`,
    description: `The highest win rate ${data.name} ${lane} build for patch ${data.gamePatch}: runes, item build, skill order, summoner spells and counters from real ranked games. Free, updated every patch.`,
    alternates: { canonical: `/builds/${data.championKey}` },
  };
}

export default async function ChampionBuildPage({ params }: { params: { champion: string } }) {
  const data = await loadBuildData(params.champion);
  if (!data) notFound();
  return (
    <>
      <BuildView {...data} />
      {/* Under the ranked build, never in place of it: a cold pro cache renders
          nothing here rather than making this page wait (TASK-310). */}
      <div className="mx-auto max-w-5xl px-4 pb-12">
        <ProPlayStrip championId={data.championKey} name={data.name} />
      </div>
    </>
  );
}
