import type { Metadata } from "next";
import Link from "next/link";
import {
  getCompleted,
  getLiveEvents,
  getTeams,
  getUpcoming,
  indexableTeams,
  recentForm,
  teamsPlayingSoon,
} from "@/domains/esports";
import type { EsportsTeam } from "@/domains/esports";
import { ChipRow } from "@/domains/esports/components/ChipRow";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { EsportsPageHeader } from "@/domains/esports/components/EsportsPageHeader";
import { FeaturedTeamCard } from "@/domains/esports/components/FeaturedTeamCard";
import { StatBlock } from "@/domains/esports/components/StatBlock";
import { TeamTile } from "@/domains/esports/components/TeamTile";

// Rosters change between splits, not daily — but the strip at the top says who
// is playing today, and a day-old answer to that is a wrong one.
export const revalidate = 900;

export const metadata: Metadata = {
  title: "LoL Esports Teams — Rosters, Results & Schedule",
  description:
    "Every active League of Legends pro team by league: current roster, next match, recent results and form. T1, G2, Gen.G, Fnatic and hundreds more.",
  alternates: { canonical: "/esports/teams" },
};

/** How many teams the "playing today" strip shows before it becomes a list. */
const FEATURED = 4;
const SOON_HOURS = 24;

interface LeagueGroup {
  id: string;
  name: string;
  region: string | null;
  teams: EsportsTeam[];
}

function anchorId(name: string): string {
  return `league-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

function groupByLeague(teams: EsportsTeam[]): LeagueGroup[] {
  const groups = new Map<string, LeagueGroup>();

  for (const team of teams) {
    const name = team.league?.name ?? "Other";
    const existing = groups.get(name);
    if (existing) existing.teams.push(team);
    else
      groups.set(name, {
        id: anchorId(name),
        name,
        region: team.league?.region ?? null,
        teams: [team],
      });
  }

  // Biggest leagues first — a league with two listed teams is not what a reader
  // scanning this page is looking for.
  return [...groups.values()].sort((a, b) => b.teams.length - a.teams.length);
}

/** One jump chip per region, pointing at the first league group that region has. */
function regionJumps(groups: LeagueGroup[]): { key: string; label: string; href: string }[] {
  const seen = new Map<string, string>();
  for (const group of groups) {
    if (!group.region || seen.has(group.region)) continue;
    seen.set(group.region, group.id);
  }
  return [...seen.entries()].map(([region, id]) => ({
    key: region,
    label: region,
    href: `#${id}`,
  }));
}

export default async function EsportsTeamsPage(): Promise<React.ReactElement> {
  const [teams, live, upcoming, completed] = await Promise.all([
    getTeams(),
    getLiveEvents(),
    getUpcoming({ limit: 120 }),
    getCompleted({ limit: 120 }),
  ]);

  const listed = indexableTeams(teams);
  const groups = groupByLeague(listed);

  const liveIds = new Set(live.map((event) => event.matchId));
  const playing = teamsPlayingSoon(
    listed,
    [...live, ...upcoming.filter((event) => !liveIds.has(event.matchId))],
    { withinHours: SOON_HOURS, now: new Date(), limit: Number.MAX_SAFE_INTEGER }
  );

  return (
    <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-7 md:px-8">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: "League of Legends pro teams",
          items: listed.map((team) => ({
            name: team.name,
            href: `/esports/teams/${team.slug}`,
          })),
        }}
      />

      <EsportsBreadcrumb items={[{ name: "Teams", href: "/esports/teams" }]} />

      <div className="mt-4">
        <EsportsPageHeader
          title="Esports teams"
          lede="Every team on the Riot feed, by league. Roster, next match and recent results on each page."
          stats={
            <>
              <StatBlock label="Teams" value={String(listed.length)} />
              <StatBlock label="Leagues" value={String(groups.length)} />
              <StatBlock
                label="Playing today"
                value={String(playing.length)}
                tone={playing.length > 0 ? "accent" : "default"}
              />
            </>
          }
        />
      </div>

      {playing.length > 0 && (
        <section className="mt-6">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-accent">
              {"// Playing today"}
            </h2>
            <span className="h-px flex-1 bg-line-1" aria-hidden />
            <Link
              href="/esports/schedule"
              className="shrink-0 font-mono text-[9.5px] uppercase tracking-label text-accent hover:underline"
            >
              Full schedule →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {playing.slice(0, FEATURED).map((entry) => (
              <FeaturedTeamCard
                key={entry.team.id}
                team={entry.team}
                form={recentForm(entry.team, completed).slice(0, 5)}
                startTime={entry.startTime}
                live={entry.live}
              />
            ))}
          </div>
        </section>
      )}

      {groups.length === 0 ? (
        <p className="gaming-card notch-sm mt-6 px-4 py-5 text-sm text-text-muted">
          Team data is temporarily unavailable. Nothing is broken on your side — try again shortly.
        </p>
      ) : (
        <>
          <section className="notch mt-6 grid gap-3 border border-border bg-surface px-4 py-3.5">
            <ChipRow label="Region" ariaLabel="Jump to a region" items={regionJumps(groups)} />
            <p className="hud-label border-t border-line-1 pt-3">
              {listed.length} teams across {groups.length} leagues
            </p>
          </section>

          <div className="mt-5 grid gap-5">
            {groups.map((group) => (
              <section key={group.name} id={group.id} className="scroll-mt-24">
                <h2 className="sticky top-[var(--esports-sticky-top,0px)] z-30 flex items-center gap-3 border border-border bg-[var(--surface-glass)] px-4 py-2.5 backdrop-blur-[14px]">
                  <span className="shrink-0 font-display text-sm font-extrabold uppercase tracking-[0.1em] text-text">
                    {group.name}
                  </span>
                  {group.region && <span className="hud-label shrink-0">{group.region}</span>}
                  <span className="h-px flex-1 bg-line-1" aria-hidden />
                  <span className="hud-label shrink-0">{group.teams.length} teams</span>
                </h2>
                <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.teams.map((team) => (
                    <TeamTile key={team.id} team={team} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </>
      )}

      <DataCredit className="mt-12" />
    </div>
  );
}
