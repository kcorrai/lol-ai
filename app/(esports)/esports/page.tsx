import type { Metadata } from "next";
import Link from "next/link";
import {
  getLeagues,
  getLiveEvents,
  getUpcoming,
  getCompleted,
  getCurrentTournament,
  getStandings,
  getProMeta,
  primaryTable,
  prominentLeagues,
} from "@/domains/esports";
import type { EsportsLeague, StandingsRow } from "@/domains/esports";
import { LeagueChips } from "@/domains/esports/components/LeagueChips";
import { LeagueGrid } from "@/domains/esports/components/LeagueGrid";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { PublicOnly } from "@/components/tools/PublicOnly";
import { HubLive } from "./HubLive";
import { HubRail } from "./HubRail";
import { HubResults } from "./HubResults";
import { HubSchedule } from "./HubSchedule";
import { HubStats } from "./HubStats";

// Five minutes. The hub's job is "what is on right now", and the live block polls on top of this.
export const revalidate = 300;

export const metadata: Metadata = {
  // No brand suffix: the root layout's title template appends one already.
  title: "LoL Esports — Live Scores, Schedule & Results",
  description:
    "Live League of Legends esports scores, today's schedule and the latest results from Worlds, LEC, LCK, LPL, LTA and every other league. Free, no login.",
  alternates: { canonical: "/esports" },
};

const FEATURED_LEAGUES = 12;
const CHIP_LEAGUES = 8;

/**
 * The standings table for the most prominent league that has one running.
 *
 * Three chained reads, all cache-backed. Any of them coming back empty simply drops the panel —
 * the hub is about today's matches, and a missing side table must not take the page with it.
 */
async function railStandings(
  leagues: EsportsLeague[]
): Promise<{ leagueName: string; leagueSlug: string; rows: StandingsRow[] } | null> {
  for (const league of prominentLeagues(leagues, 4)) {
    const tournament = await getCurrentTournament(league.id);
    if (!tournament) continue;
    const table = primaryTable(await getStandings(tournament.id));
    if (!table || table.rows.length === 0) continue;
    return { leagueName: league.name, leagueSlug: league.slug, rows: table.rows };
  }
  return null;
}

function SectionHead({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
}): React.ReactElement {
  return (
    <div className="mb-3 flex items-center gap-3">
      <span className="font-mono text-[11px] uppercase tracking-label text-text">{title}</span>
      <span className="h-px flex-1 bg-line-1" />
      {href && linkLabel && (
        <Link
          href={href}
          className="shrink-0 font-mono text-[10.5px] uppercase tracking-label text-accent hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

export default async function EsportsHubPage(): Promise<React.ReactElement> {
  const [live, upcoming, results, leagues, proMeta] = await Promise.all([
    getLiveEvents(),
    getUpcoming({ limit: 24 }),
    getCompleted({ limit: 12 }),
    getLeagues(),
    getProMeta(),
  ]);
  const standings = await railStandings(leagues);

  // The live endpoint and the schedule window overlap; the live copy is the fresher of the two,
  // so it wins and the duplicate is dropped from "next up".
  const liveIds = new Set(live.map((event) => event.matchId));
  const next = upcoming.filter((event) => !liveIds.has(event.matchId)).slice(0, 12);

  const featured = leagues.filter((league) => league.displayStatus !== "hidden");
  const nothingAtAll = live.length === 0 && next.length === 0 && results.length === 0;

  const today = new Date().toISOString().slice(0, 10);
  const matchesToday = upcoming.filter((event) => event.startTime.slice(0, 10) === today).length;

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-8 md:py-12">
      {/* The hub is the root of the trail, so it carries no breadcrumb — the leagues it fronts
          are what it has to describe. */}
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

      <PublicOnly>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-accent">
          Free · No login required
        </p>
      </PublicOnly>

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <h1 className="font-display text-[34px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[42px]">
            LoL Esports
          </h1>
          <p className="mt-3 max-w-[60ch] text-[15px] text-text-body">
            Live scores, the full schedule and results from every league Riot publishes — with the
            drafts, builds and pro stats behind them.
          </p>
        </div>
        <HubStats
          leagues={featured.length}
          matchesToday={matchesToday}
          nextStart={next[0]?.startTime ?? null}
        />
      </div>

      {featured.length > 0 && (
        <div className="notch mt-6 flex flex-wrap items-center gap-3 border border-border bg-surface px-4 py-3">
          <span className="hud-label text-[10px]">League</span>
          <LeagueChips leagues={prominentLeagues(featured, CHIP_LEAGUES)} />
          <span className="ml-auto font-mono text-[10px] uppercase tracking-label text-text-faint">
            Times in your zone
          </span>
        </div>
      )}

      {nothingAtAll ? (
        <div className="notch mt-6 border border-border bg-surface px-5 py-8 text-center">
          <p className="font-display text-lg font-bold uppercase text-text">
            Esports data is temporarily unavailable
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-text-muted">
            The official feed is not answering right now. Nothing is broken on your side — try again
            shortly.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="grid min-w-0 gap-7">
            {live.length > 0 && <HubLive initialEvents={live} />}

            <section className="min-w-0">
              <SectionHead title="Next up" href="/esports/schedule" linkLabel="Full schedule →" />
              {next.length > 0 ? (
                <HubSchedule events={next} />
              ) : (
                <p className="notch border border-border bg-surface px-4 py-5 text-sm text-text-muted">
                  No matches scheduled at the moment — most regions are between splits. Results and
                  standings stay up while the calendar is empty.
                </p>
              )}
            </section>

            {results.length > 0 && (
              <section className="min-w-0">
                <SectionHead title="Latest results" href="/esports/schedule" linkLabel="All results →" />
                <HubResults events={results} />
              </section>
            )}
          </div>

          <HubRail standings={standings} proMeta={proMeta} />
        </div>
      )}

      {featured.length > 0 && (
        <section className="mt-10">
          <SectionHead title="Leagues" href="/esports/leagues" linkLabel="All leagues →" />
          <LeagueGrid leagues={featured.slice(0, FEATURED_LEAGUES)} />
        </section>
      )}

      <p className="mt-10 text-sm text-text-muted">
        Want the picks rather than the scores? The{" "}
        <Link href="/esports/champions" className="text-accent hover:underline">
          pro champion meta
        </Link>{" "}
        aggregates every recorded game into what teams are actually playing, and how it is going for
        them.
      </p>

      <DataCredit className="mt-10" />
    </div>
  );
}
