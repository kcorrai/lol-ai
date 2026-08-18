import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getCurrentTournament,
  getLeagues,
  getStandings,
  getTeam,
  getTeams,
  getTeamMatches,
  getTeamPlayerEntries,
  headToHead,
  indexableTeams,
  isThinTeam,
  primaryTable,
  recentForm,
} from "@/domains/esports";
import type { EsportsLeague, StandingsRow } from "@/domains/esports";
import { teamRecord } from "@/domains/esports/teamRecord";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { TeamHero } from "@/domains/esports/components/TeamHero";
import { TeamMain } from "@/domains/esports/components/TeamMain";
import { TeamRail } from "@/domains/esports/components/TeamRail";
import { TeamSeasonStrip } from "@/domains/esports/components/TeamSeasonStrip";

export const revalidate = 86400;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Only teams that pass the has-content bar; the rest render on demand.
  return indexableTeams(await getTeams()).map((team) => ({ slug: team.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const team = await getTeam(params.slug);
  if (!team) return { title: "Team not found" };

  const matches = await getTeamMatches(team);
  const league = team.league?.name;

  return {
    title: `${team.name} — Roster, Schedule & Results`,
    description: `${team.name}${league ? ` (${league})` : ""}: current roster, next match, recent results and form.`,
    alternates: { canonical: `/esports/teams/${team.slug}` },
    // A page with no roster and no matches is exactly the thin filler that gets
    // a large generated section filtered (ADR-017 §4). It still renders — the
    // reader who followed a link deserves an answer — but it stays out of the
    // index.
    robots: isThinTeam(team, [...matches.upcoming, ...matches.results])
      ? { index: false, follow: true }
      : undefined,
  };
}

/**
 * The team's own league table, when the section can resolve one.
 *
 * Three lookups deep — league by name, its current tournament, that tournament's
 * table — and any of them can come back empty, which is why the rail is optional
 * rather than a section the page assumes it can fill.
 */
async function leagueStandings(league: EsportsLeague | undefined): Promise<StandingsRow[]> {
  if (!league) return [];
  const tournament = await getCurrentTournament(league.id);
  if (!tournament) return [];
  return primaryTable(await getStandings(tournament.id))?.rows ?? [];
}

export default async function TeamPage({ params }: PageProps): Promise<React.ReactElement> {
  const team = await getTeam(params.slug);
  if (!team) notFound();

  const [matches, playerEntries, leagues] = await Promise.all([
    getTeamMatches(team),
    getTeamPlayerEntries(team.id),
    getLeagues(),
  ]);
  // The team payload names its league but does not slug it, so the link up to
  // the league hub is resolved the same way `getTeamMatches` resolves fixtures.
  const league = team.league
    ? leagues.find((entry) => entry.name.toLowerCase() === team.league?.name.toLowerCase())
    : undefined;
  const standings = await leagueStandings(league);

  const form = recentForm(team, matches.results).slice(0, 5);
  const record = teamRecord(team, matches.results);
  const placement = standings.find((row) => row.team.id === team.id);
  const playerHref = new Map(
    playerEntries.map((entry) => [entry.player.id, `/esports/players/${entry.slug}`])
  );

  const next = matches.upcoming[0];
  const opponent = next?.teams.find(
    (entry) => entry.code.toLowerCase() !== team.code.toLowerCase()
  );
  const meetings =
    next && opponent
      ? headToHead(matches.results, { name: team.name, code: team.code }, opponent, {
          excludeMatchId: next.matchId,
        })
      : null;

  return (
    <>
      <TeamHero
        team={team}
        form={form}
        stats={
          matches.results.length > 0 || placement ? (
            <TeamSeasonStrip
              record={record}
              placement={placement}
              tableSize={standings.length}
              rosterSize={team.players.length}
            />
          ) : undefined
        }
      >
        <EsportsBreadcrumb
          items={[
            { name: "Teams", href: "/esports/teams" },
            { name: team.name, href: `/esports/teams/${team.slug}` },
          ]}
        />
      </TeamHero>

      <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-6 md:px-8">
        <EsportsJsonLd schema={{ kind: "team", team, roster: playerEntries }} />

        {team.status === "archived" && (
          <p className="gaming-card notch-sm mb-6 px-4 py-3 text-sm text-text-muted">
            This team is no longer active in Riot&apos;s published data. What follows is its last
            recorded roster and results.
          </p>
        )}

        <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <TeamMain
            team={team}
            upcoming={matches.upcoming}
            results={matches.results}
            playerHref={playerHref}
            meetings={meetings}
          />

          <TeamRail team={team} league={league} standings={standings} />
        </div>

        <DataCredit className="mt-10" />
      </div>
    </>
  );
}
