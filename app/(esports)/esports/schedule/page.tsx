import type { Metadata } from "next";
import Link from "next/link";
import { getLeagues, getUpcoming, getCompleted, getLiveEvents } from "@/domains/esports";
import { withinDays } from "@/domains/esports/dayGroups";
import { ScheduleDays } from "@/domains/esports/components/ScheduleDays";
import { LeagueChips } from "@/domains/esports/components/LeagueChips";
import { LiveSeriesBar } from "@/domains/esports/components/LiveSeriesBar";
import { EsportsPageHeader } from "@/domains/esports/components/EsportsPageHeader";
import { HudHeading } from "@/domains/esports/components/HudHeading";
import { StatBlock } from "@/domains/esports/components/StatBlock";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";

export const revalidate = 900; // 15 min — matches the schedule's fresh window.

export const metadata: Metadata = {
  title: "LoL Esports Schedule — Every Pro Match, Live Times",
  description:
    "The full League of Legends esports calendar: every upcoming pro match with kickoff in your own time zone, plus the latest results. Worlds, LEC, LCK, LPL, LTA and more.",
  alternates: { canonical: "/esports/schedule" },
};

/** How far ahead the fixture list runs. Beyond this, league pages take over. */
const HORIZON_DAYS = 7;
const RESULT_DAYS = 3;

const VIEW_TAB =
  "tag-cut px-3 py-1.5 font-mono text-[11px] uppercase tracking-label transition-colors";

export default async function EsportsSchedulePage(): Promise<React.ReactElement> {
  const [live, upcoming, completed, leagues] = await Promise.all([
    getLiveEvents(),
    getUpcoming({ limit: 120 }),
    getCompleted({ limit: 60 }),
    getLeagues(),
  ]);

  const now = new Date();

  // The live endpoint carries the fresher copy of anything in progress, so it
  // replaces rather than duplicates the schedule's version of the same match.
  const liveIds = new Set(live.map((event) => event.matchId));
  const fixtures = withinDays(
    [...live, ...upcoming.filter((event) => !liveIds.has(event.matchId))],
    HORIZON_DAYS,
    now
  );

  const recentCutoff = now.getTime() - RESULT_DAYS * 24 * 60 * 60 * 1000;
  const results = completed.filter((event) => new Date(event.startTime).getTime() >= recentCutoff);

  const featured = leagues.filter((league) => league.displayStatus !== "hidden").slice(0, 14);

  return (
    <>
      <LiveSeriesBar events={live} />

      <div className="mx-auto max-w-[1240px] px-5 pb-20 pt-7 md:px-8">
        <EsportsJsonLd
          schema={{
            kind: "list",
            name: "Upcoming LoL esports matches",
            items: fixtures.slice(0, 30).map((event) => ({
              name: `${event.teams[0]?.name ?? "TBD"} vs ${event.teams[1]?.name ?? "TBD"} — ${event.league.name}`,
              href: `/esports/matches/${event.matchId}`,
            })),
          }}
        />

        <EsportsBreadcrumb items={[{ name: "Schedule", href: "/esports/schedule" }]} />

        <div className="mt-4">
          <EsportsPageHeader
            title="Esports schedule"
            lede={`Every pro match for the next ${HORIZON_DAYS} days, with kickoff shown in your own time zone.`}
            stats={
              <>
                <StatBlock
                  label="Live now"
                  value={String(live.length)}
                  tone={live.length > 0 ? "loss" : "default"}
                />
                <StatBlock label="Scheduled" value={String(fixtures.length)} unit="series" />
                <StatBlock label="Leagues" value={String(featured.length)} />
              </>
            }
          />
        </div>

        {/* The console: what the page can be narrowed to, said once and above the
            list rather than repeated as headers inside it. */}
        <section className="notch mt-6 grid gap-3 border border-border bg-surface px-4 py-3.5">
          <div className="flex flex-wrap items-center gap-3">
            <nav aria-label="View" className="flex gap-1.5">
              <a href="#upcoming" className={`${VIEW_TAB} bg-accent text-background`}>
                Upcoming
              </a>
              <a
                href="#results"
                className={`${VIEW_TAB} bg-surface-2 text-text-body hover:bg-surface hover:text-text`}
              >
                Results
              </a>
            </nav>
            <span className="hud-label ml-auto">Times in your own zone</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-line-1 pt-3">
            <span className="hud-label mr-1">League</span>
            <LeagueChips leagues={featured} />
          </div>
        </section>

        <section id="upcoming" className="mt-5 scroll-mt-24">
          {fixtures.length > 0 ? (
            <ScheduleDays events={fixtures} highlightNext />
          ) : (
            <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
              Nothing is scheduled in the next {HORIZON_DAYS} days. Most regions are between splits
              — league pages keep the standings and past results while the calendar is empty.
            </p>
          )}
        </section>

        {results.length > 0 && (
          <section id="results" className="mt-12 scroll-mt-24">
            <HudHeading
              action={
                <Link
                  href="/esports/vods"
                  className="shrink-0 font-mono text-[10.5px] uppercase tracking-label text-accent hover:underline"
                >
                  VOD archive →
                </Link>
              }
            >
              Recent results
            </HudHeading>
            <ScheduleDays events={results} descending />
          </section>
        )}

        <p className="mt-12 text-sm text-text-muted">
          Looking further back? Every league keeps its full split schedule and standings on its own
          page —{" "}
          <Link href="/esports/leagues" className="text-accent hover:underline">
            browse the leagues
          </Link>
          .
        </p>

        <DataCredit className="mt-8" />
      </div>
    </>
  );
}
