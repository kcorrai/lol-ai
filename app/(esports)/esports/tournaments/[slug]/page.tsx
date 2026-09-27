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
  formatTournamentDates,
  isoDay,
  relativeTiming,
  tournamentChampion,
  tournamentName as nameOf,
  tournamentState,
} from "@/domains/esports";
import type {
  EsportsEvent,
  StandingsStage,
  TournamentChampion,
  TournamentEntry,
  TournamentState,
} from "@/domains/esports";
import { bracketLayout } from "@/domains/esports/bracket";
import { TournamentStateBadge } from "@/domains/esports/components/TournamentStateBadge";
import { StandingsTable } from "@/domains/esports/components/StandingsTable";
import { BracketView } from "@/domains/esports/components/BracketView";
import { MatchListSection } from "@/domains/esports/components/MatchListSection";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";

export const revalidate = 3600;
// Static despite the no-cache reads under it (esports feeds, Redis): without this, any one of
// them sets the page's revalidate to 0 and it is rendered per request instead (ADR-059).
export const dynamic = "force-static";
export const dynamicParams = true;

interface PageProps {
  params: { slug: string };
}

function tournamentName(entry: TournamentEntry): string {
  return nameOf(entry.tournament, entry.league);
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

function Header({
  entry,
  state,
  timing,
  champion,
}: {
  entry: TournamentEntry;
  state: TournamentState;
  timing: string;
  champion: TournamentChampion | null;
}): React.ReactElement {
  const { tournament, league } = entry;
  const dates = formatTournamentDates(tournament);

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
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm text-text-muted">
          <Link
            href={`/esports/leagues/${league.slug}`}
            className="font-mono text-[11px] uppercase tracking-label hover:text-accent"
          >
            {league.name}
          </Link>
          {dates && <span>{dates}</span>}
          <TournamentStateBadge state={state} detail={timing} />
        </p>
        {champion && (
          <p className="mt-3 text-sm text-text-body">
            Won by{" "}
            <span data-spoiler="">
              <span className="font-bold text-text">{champion.winner.name}</span>
              {champion.runnerUp ? (
                <>
                  , {champion.score} over {champion.runnerUp.name} in the{" "}
                  <Link
                    href={`/esports/matches/${champion.matchId}`}
                    className="text-accent hover:underline"
                  >
                    final
                  </Link>
                </>
              ) : null}
            </span>
            .
          </p>
        )}
      </div>
    </header>
  );
}

function Stage({
  stage,
  startTimes,
  finalMatchId,
}: {
  stage: StandingsStage;
  startTimes: Map<string, string>;
  finalMatchId?: string;
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
        <BracketView
          layout={bracketLayout(stage.matches, startTimes)}
          finalMatchId={finalMatchId}
        />
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

  const today = isoDay(new Date());
  const state = tournamentState(tournament, today);
  // Only claimed once the tournament has ended: the "final" of a running
  // bracket is a match nobody has played.
  const champion = state === "ended" ? tournamentChampion(stages) : null;

  const results = completed.filter(inTournament).slice(0, 10);
  const next = upcoming.filter(inTournament).slice(0, 10);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 md:py-14">
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

      <Header
        entry={entry}
        state={state}
        timing={relativeTiming(tournament, today)}
        champion={champion}
      />

      {stages.length === 0 ? (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          {state === "upcoming"
            ? "This split has not started. Riot publishes the format once the draw is made."
            : "Riot publishes no standings or bracket for this split. The results below are what is recorded."}
        </p>
      ) : (
        stages.map((stage, index) => (
          <Stage
            key={`${stage.stageName}-${stage.sectionName}-${index}`}
            stage={stage}
            startTimes={startTimes}
            finalMatchId={champion?.matchId}
          />
        ))
      )}

      <MatchListSection title="Upcoming" events={next} />

      <MatchListSection title="Latest results" events={results} />

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
