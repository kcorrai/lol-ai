import type { Metadata } from "next";
import Link from "next/link";
import { getLeagues, getUpcoming, getCompleted, getLiveEvents } from "@/domains/esports";
import { withinDays } from "@/domains/esports/dayGroups";
import { ScheduleDays } from "@/domains/esports/components/ScheduleDays";
import { LeagueChips } from "@/domains/esports/components/LeagueChips";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";

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

  const itemListJsonLd = fixtures.length > 0 && {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Upcoming LoL esports matches",
    itemListElement: fixtures.slice(0, 30).map((event, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: `${event.teams[0]?.name ?? "TBD"} vs ${event.teams[1]?.name ?? "TBD"} — ${event.league.name}`,
    })),
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
        />
      )}

      <EsportsBreadcrumb items={[{ name: "Schedule", href: "/esports/schedule" }]} />

      <header className="mb-6">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          Esports Schedule
        </h1>
        <p className="mt-2 max-w-2xl text-text-body">
          Every pro match for the next {HORIZON_DAYS} days, with kickoff shown in your own time
          zone.
        </p>
      </header>

      <div className="mb-8">
        <LeagueChips leagues={featured} />
      </div>

      {fixtures.length > 0 ? (
        <ScheduleDays events={fixtures} />
      ) : (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          Nothing is scheduled in the next {HORIZON_DAYS} days. Most regions are between splits —
          league pages keep the standings and past results while the calendar is empty.
        </p>
      )}

      {results.length > 0 && (
        <section className="mt-14">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Recent results
          </h2>
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
  );
}
