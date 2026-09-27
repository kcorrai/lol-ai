import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getLeague,
  getLeagues,
  getTournamentsForLeague,
  getCurrentTournament,
  getStandings,
  primaryTable,
  getUpcoming,
  getCompleted,
  isoDay,
  tournamentChampion,
  tournamentName,
  tournamentState,
} from "@/domains/esports";
import type { EsportsLeague, EsportsTournament } from "@/domains/esports";
import { MatchListSection } from "@/domains/esports/components/MatchListSection";
import { StandingsTable } from "@/domains/esports/components/StandingsTable";
import { BracketView } from "@/domains/esports/components/BracketView";
import { LeagueSplitStatus } from "@/domains/esports/components/LeagueSplitStatus";
import { SplitList } from "@/domains/esports/components/SplitList";
import { bracketLayout } from "@/domains/esports/bracket";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";

export const revalidate = 3600; // Standings move after each match day.
// Static despite the no-cache reads under it (esports feeds, Redis): without this, any one of
// them sets the page's revalidate to 0 and it is rendered per request instead (ADR-059).
export const dynamic = "force-static";

interface PageProps {
  params: { slug: string };
}

/**
 * Pre-render the leagues Riot itself features. Everything else — and there are
 * 45 of them, most dormant — renders on demand rather than being built for a
 * reader who may never arrive.
 */
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const leagues = await getLeagues();
  return leagues
    .filter(
      (league) => league.displayStatus === "force_selected" || league.displayStatus === "selected"
    )
    .map((league) => ({ slug: league.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const league = await getLeague(params.slug);
  if (!league) return { title: "League not found" };

  return {
    title: `${league.name} Standings, Schedule & Results`,
    description: `${league.name} standings, upcoming matches and latest results. Every game, every split, updated automatically.`,
    alternates: { canonical: `/esports/leagues/${league.slug}` },
  };
}

function LeagueHeader({
  league,
  tournament,
}: {
  league: EsportsLeague;
  tournament: EsportsTournament | null;
}): React.ReactElement {
  return (
    <header className="mb-8 flex items-start gap-4">
      {league.image && (
        <Image
          src={league.image}
          alt=""
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 object-contain"
          aria-hidden
          unoptimized
        />
      )}
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          {league.name}
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-text-muted">
          {league.region.toLowerCase()}
          {tournament ? ` · ${tournamentName(tournament, league)}` : ""}
        </p>
      </div>
    </header>
  );
}

export default async function LeaguePage({ params }: PageProps): Promise<React.ReactElement> {
  const league = await getLeague(params.slug);
  if (!league) notFound();

  const [tournaments, current, upcoming, results] = await Promise.all([
    getTournamentsForLeague(league.id),
    getCurrentTournament(league.id),
    getUpcoming({ leagueId: league.id, limit: 10 }),
    getCompleted({ leagueId: league.id, limit: 10 }),
  ]);

  const stages = current ? await getStandings(current.id) : [];
  const table = primaryTable(stages);

  const today = isoDay(new Date());
  // A concluded split leaves the reader asking "so when is the next one?" —
  // for Worlds and MSI that gap is most of the year.
  const nextUp = tournaments
    .filter((t) => t.startDate && t.startDate > today)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0];

  // The latest bracket anyone has been drawn into — the playoffs, once a split
  // reaches them. A table alone says nothing about who is still in it.
  const bracket = [...stages]
    .reverse()
    .find(
      (stage): stage is Extract<(typeof stages)[number], { kind: "bracket" }> =>
        stage.kind === "bracket" &&
        stage.matches.some((match) => match.teams.some((team) => team.decided))
    );
  const startTimes = new Map(
    [...upcoming, ...results].map((event) => [event.matchId, event.startTime])
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: `${league.name} standings`,
          items: (table?.rows ?? []).map((row) => ({
            name: row.team.name,
            href: row.team.slug ? `/esports/teams/${row.team.slug}` : undefined,
          })),
        }}
      />

      <EsportsBreadcrumb
        items={[
          { name: "Leagues", href: "/esports/leagues" },
          { name: league.name, href: `/esports/leagues/${league.slug}` },
        ]}
      />

      <LeagueHeader league={league} tournament={current} />

      {current && (
        <LeagueSplitStatus
          league={league}
          current={current}
          stages={stages}
          stageNow={upcoming[0]?.blockName ?? null}
          nextUp={nextUp}
          today={today}
        />
      )}

      <section>
        <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          Standings
        </h2>
        {table ? (
          <>
            {table.sectionName !== "Regular Season" && (
              <p className="hud-label mb-2">{table.sectionName}</p>
            )}
            <StandingsTable rows={table.rows} />
          </>
        ) : (
          <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
            {stages.length > 0
              ? "This split is played as a bracket rather than a table — see it below."
              : "No standings published for this split yet."}
          </p>
        )}
      </section>

      {bracket && current && (
        <section className="mt-12">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
              {bracket.stageName}
            </h2>
            <Link
              href={`/esports/tournaments/${current.slug}`}
              className="font-mono text-[11px] uppercase tracking-label text-accent hover:underline"
            >
              Full tournament →
            </Link>
          </div>
          <BracketView
            layout={bracketLayout(bracket.matches, startTimes)}
            finalMatchId={
              tournamentState(current, today) === "ended"
                ? tournamentChampion(stages)?.matchId
                : undefined
            }
          />
        </section>
      )}

      <MatchListSection title="Upcoming" events={upcoming} />

      <MatchListSection title="Latest results" events={results} />

      {tournaments.length > 1 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Splits
          </h2>
          <SplitList
            league={league}
            tournaments={tournaments}
            currentId={current?.id ?? null}
            today={today}
          />
        </section>
      )}

      <p className="mt-12 text-sm text-text-muted">
        See which champions {league.name} teams are actually picking in the{" "}
        <Link
          href={`/esports/champions?league=${league.slug}`}
          className="text-accent hover:underline"
        >
          {league.name} champion meta
        </Link>
        .
      </p>

      <DataCredit className="mt-12" />
    </div>
  );
}
