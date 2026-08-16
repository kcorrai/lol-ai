import type { Metadata } from "next";
import Link from "next/link";
import { getLeagues, getLiveEvents, getUpcoming, getCompleted } from "@/domains/esports";
import type { EsportsEvent } from "@/domains/esports";
import { MatchRow } from "@/domains/esports/components/MatchRow";
import { LeagueGrid } from "@/domains/esports/components/LeagueGrid";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { LiveMatches } from "@/domains/esports/components/LiveMatches";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { PublicOnly } from "@/components/tools/PublicOnly";

// Five minutes. The hub's job is "what is on right now", and the live block is
// upgraded to real polling in TASK-304 — until then this is the freshness floor.
export const revalidate = 300;

export const metadata: Metadata = {
  // No brand suffix: the root layout's title template appends one already.
  title: "LoL Esports — Live Scores, Schedule & Results",
  description:
    "Live League of Legends esports scores, today's schedule and the latest results from Worlds, LEC, LCK, LPL, LTA and every other league. Free, no login.",
  alternates: { canonical: "/esports" },
};

const FEATURED_LEAGUES = 12;

function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: React.ReactNode;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <section className="mt-10 first:mt-0">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          {title}
        </h2>
        {aside ? <span className="hud-label">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

function MatchList({ events }: { events: EsportsEvent[] }): React.ReactElement {
  return (
    <div className="grid gap-2">
      {events.map((event) => (
        <MatchRow
          key={event.matchId}
          event={event}
          href={`/esports/matches/${event.matchId}`}
          withDate
        />
      ))}
    </div>
  );
}

export default async function EsportsHubPage(): Promise<React.ReactElement> {
  const [live, upcoming, results, leagues] = await Promise.all([
    getLiveEvents(),
    getUpcoming({ limit: 24 }),
    getCompleted({ limit: 12 }),
    getLeagues(),
  ]);

  // The live endpoint and the schedule window overlap; the live copy is the
  // fresher of the two, so it wins and the duplicate is dropped from "next up".
  const liveIds = new Set(live.map((event) => event.matchId));
  const next = upcoming.filter((event) => !liveIds.has(event.matchId)).slice(0, 12);

  const featured = leagues.filter((league) => league.displayStatus !== "hidden");
  const nothingAtAll = live.length === 0 && next.length === 0 && results.length === 0;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      {/* The hub is the root of the trail, so it carries no breadcrumb — the
          leagues it fronts are what it has to describe. */}
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: "League of Legends esports leagues",
          items: featured.slice(0, FEATURED_LEAGUES).map((league) => ({
            name: league.name,
            href: `/esports/leagues/${league.slug}`,
          })),
        }}
      />

      <header className="mb-8">
        <PublicOnly>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-accent">
            Free · No login required
          </p>
        </PublicOnly>
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          LoL Esports
        </h1>
        <p className="mt-2 max-w-2xl text-text-body">
          Live scores, the full schedule and results from every league Riot publishes — with the
          drafts, builds and pro stats behind them.
        </p>
      </header>

      {nothingAtAll ? (
        <div className="gaming-card notch px-5 py-8 text-center">
          <p className="font-display text-lg font-bold uppercase text-text">
            Esports data is temporarily unavailable
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            The official feed is not answering right now. Nothing is broken on your side — try again
            shortly.
          </p>
        </div>
      ) : (
        <>
          {live.length > 0 && (
            <section className="mt-10 first:mt-0">
              <LiveMatches initialEvents={live} />
            </section>
          )}

          <Section
            title="Next up"
            aside={
              <Link href="/esports/schedule" className="hover:text-accent">
                Full schedule →
              </Link>
            }
          >
            {next.length > 0 ? (
              <MatchList events={next} />
            ) : (
              <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
                No matches scheduled at the moment — most regions are between splits. Results and
                standings stay up while the calendar is empty.
              </p>
            )}
          </Section>

          {results.length > 0 && (
            <Section title="Latest results">
              <MatchList events={results} />
            </Section>
          )}
        </>
      )}

      {featured.length > 0 && (
        <Section
          title="Leagues"
          aside={
            <Link href="/esports/leagues" className="hover:text-accent">
              All leagues →
            </Link>
          }
        >
          <LeagueGrid leagues={featured.slice(0, FEATURED_LEAGUES)} />
        </Section>
      )}

      <DataCredit className="mt-12" />
    </div>
  );
}
