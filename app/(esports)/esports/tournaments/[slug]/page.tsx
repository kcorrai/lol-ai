import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTournament,
  getTournamentIndex,
  getStandings,
  getUpcoming,
  getCompleted,
} from "@/domains/esports";
import type { EsportsEvent, StandingsStage, TournamentEntry } from "@/domains/esports";
import { bracketLayout, bracketWinner } from "@/domains/esports/bracket";
import { StandingsTable } from "@/domains/esports/components/StandingsTable";
import { BracketView } from "@/domains/esports/components/BracketView";
import { MatchRow } from "@/domains/esports/components/MatchRow";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";

export const revalidate = 3600;
export const dynamicParams = true;

interface PageProps {
  params: { slug: string };
}

/**
 * A tournament's name, as a reader writes it.
 *
 * Feed slugs are machine-shaped ("lck_split_2_2026") and title-casing them
 * alone produces "Lck Split 2 2026" — every league acronym mangled. The slug
 * usually opens with the league's own slug, so that prefix is swapped for the
 * league's real name and only the rest is title-cased.
 */
function tournamentName(entry: TournamentEntry): string {
  const { tournament, league } = entry;
  const titleCase = (value: string): string =>
    value.replace(/[_-]+/g, " ").replace(/\b\w/g, (character) => character.toUpperCase()).trim();

  const slug = tournament.slug.toLowerCase();
  const prefix = league.slug.toLowerCase();

  if (slug === prefix) return league.name;
  if (slug.startsWith(`${prefix}_`) || slug.startsWith(`${prefix}-`)) {
    return `${league.name} ${titleCase(slug.slice(prefix.length + 1))}`.trim();
  }

  return titleCase(tournament.slug);
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const index = await getTournamentIndex();
  return index.map((entry) => ({ slug: entry.tournament.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const entry = await getTournament(params.slug);
  if (!entry) return { title: "Tournament not found" };

  const { tournament, league } = entry;
  const name = tournamentName(entry);
  const stages = await getStandings(tournament.id);

  return {
    title: `${name} — Standings, Bracket & Results`,
    description: `${name} in the ${league.name}: standings, the playoff bracket and every result${
      tournament.startDate ? `, from ${tournament.startDate}` : ""
    }.`,
    alternates: { canonical: `/esports/tournaments/${tournament.slug}` },
    // A split the feed has published but not populated is the thin page ADR-017
    // §4 keeps out of the index. It still renders for anyone who followed a link.
    robots: stages.length === 0 ? { index: false, follow: true } : undefined,
  };
}

type TournamentState = "upcoming" | "running" | "ended";

function stateOf(entry: TournamentEntry, today: string): TournamentState {
  const { startDate, endDate } = entry.tournament;
  if (startDate && startDate > today) return "upcoming";
  if (endDate && endDate < today) return "ended";
  return "running";
}

/**
 * The team that won the last decided match of the last bracket stage.
 *
 * Only claimed for a tournament that has actually ended: the final of a running
 * bracket is a match nobody has played, and naming a champion from a
 * semi-final winner would be worse than naming none.
 */
function champion(stages: StandingsStage[], state: TournamentState): string | null {
  if (state !== "ended") return null;

  const brackets = stages.filter(
    (stage): stage is Extract<StandingsStage, { kind: "bracket" }> => stage.kind === "bracket"
  );
  const last = brackets[brackets.length - 1];
  if (!last) return null;

  const final = [...last.matches].reverse().find((match) => bracketWinner(match) !== null);
  return final ? (bracketWinner(final)?.name ?? null) : null;
}

function Header({
  entry,
  state,
  winner,
}: {
  entry: TournamentEntry;
  state: TournamentState;
  winner: string | null;
}): React.ReactElement {
  const { tournament, league } = entry;

  return (
    <header className="mb-8 flex flex-wrap items-start gap-4">
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
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          {tournamentName(entry)}
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-text-muted">
          <Link href={`/esports/leagues/${league.slug}`} className="hover:text-accent">
            {league.name}
          </Link>
          {tournament.startDate ? ` · ${tournament.startDate}` : ""}
          {tournament.endDate ? ` → ${tournament.endDate}` : ""}
          {state === "running" ? " · Running" : ""}
        </p>
        {winner && (
          <p className="mt-2 text-sm text-text-body">
            Won by <span className="font-bold text-text">{winner}</span>.
          </p>
        )}
      </div>
    </header>
  );
}

function Stage({
  stage,
  startTimes,
}: {
  stage: StandingsStage;
  startTimes: Map<string, string>;
}): React.ReactElement {
  // The feed repeats the stage name on a single-section stage ("Knockouts /
  // Knockouts"); saying it twice reads as a mistake.
  const heading =
    stage.sectionName === stage.stageName
      ? stage.stageName
      : `${stage.stageName} · ${stage.sectionName}`;

  return (
    <section className="mt-12">
      <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
        {heading}
      </h2>
      {stage.kind === "table" ? (
        <StandingsTable rows={stage.rows} />
      ) : (
        <BracketView layout={bracketLayout(stage.matches, startTimes)} />
      )}
    </section>
  );
}

export default async function TournamentPage({ params }: PageProps): Promise<React.ReactElement> {
  const entry = await getTournament(params.slug);
  if (!entry) notFound();

  const { tournament, league } = entry;

  const [stages, upcoming, completed] = await Promise.all([
    getStandings(tournament.id),
    getUpcoming({ leagueId: league.id, limit: 30 }),
    getCompleted({ leagueId: league.id, limit: 30 }),
  ]);

  // Kickoff times come from the schedule; the standings payload has none, and
  // the bracket needs them to work out which round a match belongs to.
  const inTournament = (event: EsportsEvent): boolean => event.tournamentId === tournament.id;
  const events = [...upcoming, ...completed].filter(inTournament);
  const startTimes = new Map(events.map((event) => [event.matchId, event.startTime]));

  const today = new Date().toISOString().slice(0, 10);
  const state = stateOf(entry, today);
  const winner = champion(stages, state);

  const results = completed.filter(inTournament).slice(0, 10);
  const next = upcoming.filter(inTournament).slice(0, 10);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: `${tournamentName(entry)} stages`,
          items: stages.map((stage) => ({ name: stage.sectionName })),
        }}
      />

      <EsportsBreadcrumb
        items={[
          { name: "Leagues", href: "/esports/leagues" },
          { name: league.name, href: `/esports/leagues/${league.slug}` },
          { name: tournamentName(entry), href: `/esports/tournaments/${tournament.slug}` },
        ]}
      />

      <Header entry={entry} state={state} winner={winner} />

      {stages.length === 0 ? (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          {state === "upcoming"
            ? "This split has not started. Riot publishes the format once the draw is made."
            : "Riot publishes no standings or bracket for this split. The results below are what is recorded."}
        </p>
      ) : (
        stages.map((stage, index) => (
          <Stage key={`${stage.stageName}-${stage.sectionName}-${index}`} stage={stage} startTimes={startTimes} />
        ))
      )}

      {next.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Upcoming
          </h2>
          <div className="grid gap-2">
            {next.map((event) => (
              <MatchRow
                key={event.matchId}
                event={event}
                href={`/esports/matches/${event.matchId}`}
                showLeague={false}
                withDate
              />
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
              <MatchRow
                key={event.matchId}
                event={event}
                href={`/esports/matches/${event.matchId}`}
                showLeague={false}
                withDate
              />
            ))}
          </div>
        </section>
      )}

      <p className="mt-12 text-sm text-text-muted">
        See which champions were picked across this split in the{" "}
        <Link
          href={`/esports/champions?league=${league.slug}`}
          className="text-accent hover:underline"
        >
          {league.name} champion meta
        </Link>
        .
      </p>

      <DataCredit className="mt-8" />
    </div>
  );
}
