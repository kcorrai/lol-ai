import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMetaSnapshot } from "@/domains/meta";
import { BuildView } from "@/domains/meta/components/build/BuildView";
import { loadAramBuildData } from "@/domains/meta/components/build/loadBuildData";

export const revalidate = 43200; // 12h ISR
export const dynamicParams = true;

// Prerender the ~30 most-picked ARAM champions; the rest render on demand (ISR).
export async function generateStaticParams(): Promise<{ champion: string }[]> {
  const snapshot = await getMetaSnapshot({ mode: "aram" });
  if (!snapshot) return [];
  return [...snapshot.champions]
    .sort((a, b) => b.overallPickRate - a.overallPickRate)
    .slice(0, 30)
    .map((c) => ({ champion: c.championKey }));
}

export async function generateMetadata({
  params,
}: {
  params: { champion: string };
}): Promise<Metadata> {
  const data = await loadAramBuildData(params.champion);
  if (!data) return { title: "ARAM build not found" };
  return {
    title: `${data.name} ARAM Build, Runes & Items — Patch ${data.gamePatch}`,
    description: `The highest win rate ${data.name} ARAM build for patch ${data.gamePatch}: runes, item build, skill order and summoner spells from real ARAM games. Free, updated every patch.`,
    alternates: { canonical: `/aram/${data.championKey}` },
  };
}

export default async function AramBuildPage({ params }: { params: { champion: string } }) {
  const data = await loadAramBuildData(params.champion);
  if (!data) notFound();
  return <BuildView {...data} />;
}
