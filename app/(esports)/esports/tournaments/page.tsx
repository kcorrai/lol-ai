import type { Metadata } from "next";
import Link from "next/link";
import { getTournamentOverview } from "@/domains/esports";
import type { TournamentOverviewEntry } from "@/domains/esports";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { EsportsPageHeader } from "@/domains/esports/components/EsportsPageHeader";
import { HudHeading } from "@/domains/esports/components/HudHeading";
import { StatBlock } from "@/domains/esports/components/StatBlock";
import { TournamentCard } from "@/domains/esports/components/TournamentCard";
import { daysBetween, tournamentName } from "@/domains/esports";

// Hourly, like the tournament lists and standings it reads.
export const revalidate = 3600;
// Static despite the no-cache reads under it (esports feeds, Redis): without this, any one of
// them sets the page's revalidate to 0 and it is rendered per request instead (ADR-059).
export const dynamic = "force-static";

export const metadata: Metadata = {
  title: "LoL Esports Tournaments — On Now, Coming Up & Recent Winners",
  description:
    "Every League of Legends esports tournament that is on right now, what starts next with a countdown, and who won the ones that just finished — Worlds, MSI, LCK, LPL, LEC, LCS and more.",
  alternates: { canonical: "/esports/tournaments" },
};

function Section({
  title,
  empty,
  entries,
  today,
}: {
  title: string;
  empty: string;
  entries: TournamentOverviewEntry[];
  today: string;
}): React.ReactElement {
  return (
    <section className="mt-10">
      <HudHeading>{title}</HudHeading>
      {entries.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((entry) => (
            <TournamentCard key={entry.tournament.id} entry={entry} today={today} />
          ))}
        </div>
      ) : (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">{empty}</p>
      )}
    </section>
  );
}

export default async function EsportsTournamentsPage(): Promise<React.ReactElement> {
  const overview = await getTournamentOverview();
  const { today, running, upcoming, finished } = overview;
  const next = upcoming[0];

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 md:px-8 md:py-12">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: "League of Legends esports tournaments",
          items: [...running, ...upcoming, ...finished].map((entry) => ({
            name: tournamentName(entry.tournament, entry.league),
            href: `/esports/tournaments/${entry.tournament.slug}`,
          })),
        }}
      />

      <EsportsBreadcrumb items={[{ name: "Tournaments", href: "/esports/tournaments" }]} />

      <div className="mt-4">
        <EsportsPageHeader
          title="Tournaments"
          lede="What is being played right now, what starts next, and who won the tournaments that just finished."
          stats={
            <>
              <StatBlock
                label="On now"
                value={String(running.length)}
                tone={running.length > 0 ? "accent" : "default"}
              />
              <StatBlock label="Coming up" value={String(upcoming.length)} />
              {next?.tournament.startDate && (
                <StatBlock
                  label="Next start"
                  value={String(daysBetween(today, next.tournament.startDate))}
                  unit={`${daysBetween(today, next.tournament.startDate) === 1 ? "day" : "days"} · ${tournamentName(next.tournament, next.league)}`}
                />
              )}
            </>
          }
        />
      </div>

      <Section
        title="On now"
        entries={running}
        today={today}
        empty="No tournament is being played today — most regions are between splits."
      />
      <Section
        title="Coming up"
        entries={upcoming}
        today={today}
        empty="Nothing is scheduled to start in the next four months yet. Riot publishes splits as they are confirmed."
      />
      <Section
        title="Recently finished"
        entries={finished}
        today={today}
        empty="No tournament has finished recently."
      />

      <p className="mt-10 text-sm text-text-muted">
        Looking for an older split? Every league keeps its full history on its own page —{" "}
        <Link href="/esports/leagues" className="text-accent hover:underline">
          browse the leagues
        </Link>
        .
      </p>

      <DataCredit className="mt-8" />
    </div>
  );
}
