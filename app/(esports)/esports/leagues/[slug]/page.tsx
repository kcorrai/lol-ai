import type { Metadata } from "next";
import Image from "next/image";
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
} from "@/domains/esports";
import type { EsportsLeague, EsportsTournament } from "@/domains/esports";
import { MatchRow } from "@/domains/esports/components/MatchRow";
import { StandingsTable } from "@/domains/esports/components/StandingsTable";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";

export const revalidate = 3600; // Standings move after each match day.

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

function splitLabel(tournament: EsportsTournament): string {
  // Feed slugs are machine-shaped ("lec_split_3_2026") — the words are right,
  // the punctuation is not.
  return tournament.slug.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type TournamentState = "upcoming" | "running" | "ended";

function tournamentState(tournament: EsportsTournament, today: string): TournamentState {
  if (tournament.startDate && tournament.startDate > today) return "upcoming";
  if (tournament.endDate && tournament.endDate < today) return "ended";
  return "running";
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
          {tournament ? ` · ${splitLabel(tournament)}` : ""}
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

  const today = new Date().toISOString().slice(0, 10);
  const currentState = current ? tournamentState(current, today) : null;
  // A concluded split leaves the reader asking "so when is the next one?" —
  // for Worlds and MSI that gap is most of the year.
  const nextUp = tournaments
    .filter((t) => t.startDate && t.startDate > today)
    .sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""))[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsBreadcrumb
        items={[
          { name: "Leagues", href: "/esports/leagues" },
          { name: league.name, href: `/esports/leagues/${league.slug}` },
        ]}
      />

      <LeagueHeader league={league} tournament={current} />

      {currentState === "ended" && nextUp && (
        <p className="gaming-card notch-sm mb-8 px-4 py-3 text-sm text-text-body">
          <span className="text-text">{splitLabel(nextUp)}</span> starts {nextUp.startDate}. Below
          is how {splitLabel(current!)} finished.
        </p>
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
              ? `This split is played as a bracket rather than a table — the results below show how it ${currentState === "ended" ? "finished" : "is going"}.`
              : "No standings published for this split yet."}
          </p>
        )}
      </section>

      {upcoming.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Upcoming
          </h2>
          <div className="grid gap-2">
            {upcoming.map((event) => (
              <MatchRow key={event.matchId} event={event} showLeague={false} withDate />
            ))}
          </div>
        </section>
      )}

      {results.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Latest results
          </h2>
          <div className="grid gap-2">
            {results.map((event) => (
              <MatchRow key={event.matchId} event={event} showLeague={false} withDate />
            ))}
          </div>
        </section>
      )}

      {tournaments.length > 1 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Splits
          </h2>
          {/* Plain text for now: tournament pages land in TASK-306, and a link
              to a page that does not exist is worse than no link. */}
          <ul className="grid gap-1.5">
            {tournaments.slice(0, 8).map((tournament) => (
              <li
                key={tournament.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 pb-1.5 text-sm last:border-0"
              >
                <span className={tournament.id === current?.id ? "text-text" : "text-text-body"}>
                  {splitLabel(tournament)}
                  {tournament.id === current?.id && (
                    <span className="hud-label ml-2 text-accent">Current</span>
                  )}
                </span>
                <span className="font-mono text-[11px] text-text-faint">
                  {tournament.startDate ?? "—"}
                  {tournament.endDate ? ` → ${tournament.endDate}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <DataCredit className="mt-12" />
    </div>
  );
}
