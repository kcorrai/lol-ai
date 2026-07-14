import type { Metadata } from "next";
import Link from "next/link";
import { evaluateDraft, ALL_POSITIONS, type DraftTeam } from "@/domains/meta";
import { fetchAllChampions } from "@/lib/ddragon/championsData";
import { ToolBreadcrumb } from "@/domains/meta/components/ToolBreadcrumb";
import { DraftBuilder } from "./DraftBuilder";
import { DraftResults } from "./DraftResults";

export const metadata: Metadata = {
  title: "LoL Draft Analyzer — Team Composition Checker | LoL AI Coach",
  description:
    "Analyze any League of Legends 5v5 draft: damage profile, frontline, scaling, meta strength and lane matchups from real ranked data. Free, no login.",
  alternates: { canonical: "/tools/draft-analyzer" },
};

interface PageProps {
  searchParams: { blue?: string; red?: string };
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

  const [evaluation, allChampions] = await Promise.all([
    hasPicks ? evaluateDraft(toTeam(blueSlots), toTeam(redSlots)) : Promise.resolve(null),
    fetchAllChampions(),
  ]);
  const championOptions = allChampions
    .map((c) => ({ key: c.id, name: c.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-5xl px-4 py-14">
      <ToolBreadcrumb
        items={[
          { name: "Free Tools", href: "/tools" },
          { name: "Draft Analyzer", href: "/tools/draft-analyzer" },
        ]}
      />

      <header className="mb-8">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
          Free Tool · No login required
        </p>
        <h1 className="font-display text-3xl font-black text-text md:text-4xl">Draft Analyzer</h1>
        <p className="mt-2 max-w-2xl text-text-muted">
          Build both team comps and get a stats-based read on damage balance, frontline, scaling,
          meta strength and every lane matchup.
        </p>
      </header>

      <div className="mb-10">
        <DraftBuilder champions={championOptions} blue={blueSlots} red={redSlots} />
      </div>

      {!hasPicks && (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          Add at least one champion to each team to analyze the draft.
        </p>
      )}

      {hasPicks && !evaluation && (
        <p className="rounded-xl border border-dashed border-border px-4 py-12 text-center text-text-muted">
          Meta data is unavailable right now. Please try again shortly.
        </p>
      )}

      {evaluation && (
        <>
          <div className="mb-6 text-sm text-text-muted">Patch {evaluation.patch}</div>
          <DraftResults evaluation={evaluation} />

          <div className="mt-12 rounded-2xl border border-accent/30 bg-accent/5 p-6 text-center">
            <h2 className="font-display text-xl font-bold text-text">
              Want a deeper, personalized read on your games?
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-text-muted">
              This tool is stats-based. Connect your Riot account for an AI coaching report that
              analyzes your actual drafts, mistakes, and how to climb.
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
