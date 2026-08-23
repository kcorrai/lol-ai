import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { parsePosition, POSITION_LABELS } from "@/domains/meta";
import { BuildView } from "@/domains/meta/components/build/BuildView";
import { ProPlayStrip } from "@/domains/esports/components/ProPlayStrip";
import { loadBuildData } from "@/domains/meta/components/build/loadBuildData";

export const revalidate = 43200; // 12h ISR
export const dynamicParams = true;

// Lane variants render on demand (ISR); the primary /builds/[champion] page is
// prerendered, which is enough for initial crawl.
export function generateStaticParams(): { champion: string; role: string }[] {
  return [];
}

interface PageProps {
  params: { champion: string; role: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const position = parsePosition(params.role);
  if (!position) return { title: "Champion build not found" };
  const data = await loadBuildData(params.champion, position);
  if (!data) return { title: "Champion build not found" };
  const lane = POSITION_LABELS[data.position];
  return {
    title: `${data.name} ${lane} Build, Runes & Skill Order — Patch ${data.gamePatch}`,
    description: `The highest win rate ${data.name} ${lane} build for patch ${data.gamePatch}: runes, items, skill order, spells and counters from real ranked games. Free, updated every patch.`,
    alternates: { canonical: `/builds/${data.championKey}/${params.role.toLowerCase()}` },
  };
}

export default async function ChampionRoleBuildPage({ params }: PageProps) {
  const position = parsePosition(params.role);
  if (!position) notFound();
  const data = await loadBuildData(params.champion, position);

  if (!data) {
    /**
     * The lane has no build — but the champion may still exist.
     *
     * `BuildHero` renders a tab for every lane the meta snapshot reports, and op.gg's per-lane
     * build detail does not always exist for a lane its own snapshot lists: Syndra bot is played
     * enough to appear and has no detail behind it. That tab was a 404 (LA-71).
     *
     * Temporary, not permanent: the lane is missing *this patch*, and a 308 would teach browsers
     * and crawlers to skip it for ever.
     */
    const primary = await loadBuildData(params.champion);
    if (primary) redirect(`/builds/${primary.championKey}`);
    notFound();
  }

  return (
    <>
      <BuildView {...data} />
      <div className="mx-auto max-w-[1240px] px-5 pb-12 md:px-8">
        <ProPlayStrip championId={data.championKey} name={data.name} />
      </div>
    </>
  );
}
