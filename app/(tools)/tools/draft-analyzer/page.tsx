import type { Metadata } from "next";
import {
  evaluateDraft,
  getMetaSnapshot,
  ALL_POSITIONS,
  formatGamePatch,
  type CanonicalPosition,
  type DraftTeam,
} from "@/domains/meta";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { ToolUpgradeNudge } from "../../ToolUpgradeNudge";
import { ToolHeader } from "../../ToolHeader";
import { ToolEmpty } from "../../ToolEmpty";
import { ToolCta } from "../../ToolCta";
import { DraftBuilder } from "./DraftBuilder";
import { LiveGameButton } from "@/components/tools/LiveGameButton";
import { DraftResults } from "@/domains/meta/components/DraftResults";

interface PageProps {
  searchParams: { blue?: string; red?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  // Shared draft permalinks (?blue/?red) are unlimited combinations — keep them
  // out of the index and canonicalise to the clean tool page.
  const hasParams = Boolean(searchParams.blue || searchParams.red);
  return {
    title: "LoL Draft Analyzer — Team Composition Checker",
    description:
      "Analyze any League of Legends 5v5 draft: damage profile, frontline, scaling, meta strength and lane matchups from real ranked data. Free, no login.",
    alternates: { canonical: "/tools/draft-analyzer" },
    ...(hasParams ? { robots: { index: false, follow: true } } : {}),
  };
}

// "Garen,Vi,,Jinx,Leona" → array of 5 (null for blanks), indexed by ALL_POSITIONS.
function parseSlots(param: string | undefined): (string | null)[] {
  const slots: (string | null)[] = [null, null, null, null, null];
  if (!param) return slots;
  param.split(",").forEach((raw, i) => {
    if (i < 5 && raw.trim()) slots[i] = raw.trim();
  });
  return slots;
}

function toTeam(slots: (string | null)[]): DraftTeam {
  const team: DraftTeam = {};
  slots.forEach((key, i) => {
    if (key) team[ALL_POSITIONS[i]] = key;
  });
  return team;
}

export default async function DraftAnalyzerPage({ searchParams }: PageProps) {
  const blueSlots = parseSlots(searchParams.blue);
  const redSlots = parseSlots(searchParams.red);
  const hasPicks = blueSlots.some(Boolean) && redSlots.some(Boolean);

  const [evaluation, allChampions, snapshot] = await Promise.all([
    hasPicks ? evaluateDraft(toTeam(blueSlots), toTeam(redSlots)) : Promise.resolve(null),
    fetchAllChampions(),
    getMetaSnapshot(),
  ]);

  // Which lanes each champion actually plays, so the picker can offer only
  // on-role champions per slot. Keyed by lowercased Data Dragon id.
  const positionsByKey = new Map<string, CanonicalPosition[]>();
  for (const champion of snapshot?.champions ?? []) {
    const lanes = champion.positions.map((p) => p.position);
    if (lanes.length > 0) positionsByKey.set(champion.championKey.toLowerCase(), lanes);
  }

  const championOptions = allChampions
    .map((c) => ({ key: c.id, name: c.name, positions: positionsByKey.get(c.id.toLowerCase()) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-12 md:px-8">
      <Breadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Draft Analyzer", href: "/tools/draft-analyzer" },
        ]}
      />

      <ToolHeader
        title="Draft Analyzer"
        subtitle="Build both team comps and get a stats-based read on damage balance, frontline, engage, scaling, meta strength and every lane matchup."
      />

      <div className="mb-10">
        <LiveGameButton mode="draft" />
        <DraftBuilder champions={championOptions} blue={blueSlots} red={redSlots} />
      </div>

      {!hasPicks && (
        <ToolEmpty
          title="Add a champion to each side"
          body="One pick per team is enough to start; every lane you fill adds a head-to-head read."
        />
      )}

      {hasPicks && !evaluation && (
        <ToolEmpty
          title="Meta data is unavailable"
          body="The ranked snapshot could not be read right now. Please try again shortly."
        />
      )}

      {evaluation && (
        <>
          <p className="hud-label mb-4 text-[10.5px]">
            Patch {formatGamePatch(evaluation.patch)} · ranked solo/duo
          </p>
          <DraftResults evaluation={evaluation} />

          <ToolUpgradeNudge message="Go Pro for AI coaching on YOUR games — how your real drafts play out, your worst matchups, and a step-by-step climb plan." />

          <ToolCta
            eyebrow="This read is stats-based"
            title="Want a deeper, personalized read on your games?"
            body="Connect your Riot account for an AI coaching report that analyzes your actual drafts, mistakes, and how to climb."
          />
        </>
      )}
    </div>
  );
}
