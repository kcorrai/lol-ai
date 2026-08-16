import type { Metadata } from "next";
import { getLeagues } from "@/domains/esports";
import type { EsportsLeague } from "@/domains/esports";
import { LeagueGrid } from "@/domains/esports/components/LeagueGrid";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";

export const revalidate = 86400; // Leagues change at most between splits.

export const metadata: Metadata = {
  title: "LoL Esports Leagues — Every Region's Standings & Schedule",
  description:
    "Every League of Legends esports league Riot publishes, by region: Worlds, MSI, LCK, LPL, LEC, LTA, LCP and more. Standings, schedule and results for each.",
  alternates: { canonical: "/esports/leagues" },
};

// International first, then the four majors, then everything else in feed order.
const REGION_ORDER = ["INTERNATIONAL", "KOREA", "CHINA", "EMEA", "NORTH AMERICA", "AMERICAS"];

function byRegion(leagues: EsportsLeague[]): [string, EsportsLeague[]][] {
  const groups = new Map<string, EsportsLeague[]>();
  for (const league of leagues) {
    const existing = groups.get(league.region);
    if (existing) existing.push(league);
    else groups.set(league.region, [league]);
  }

  return [...groups.entries()].sort(([a], [b]) => {
    const rankA = REGION_ORDER.indexOf(a);
    const rankB = REGION_ORDER.indexOf(b);
    if (rankA !== -1 || rankB !== -1) {
      return (
        (rankA === -1 ? REGION_ORDER.length : rankA) - (rankB === -1 ? REGION_ORDER.length : rankB)
      );
    }
    return a.localeCompare(b);
  });
}

function regionLabel(region: string): string {
  return region.charAt(0) + region.slice(1).toLowerCase();
}

export default async function EsportsLeaguesPage(): Promise<React.ReactElement> {
  const leagues = await getLeagues();
  const groups = byRegion(leagues);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: "League of Legends esports leagues",
          items: leagues.map((league) => ({
            name: league.name,
            href: `/esports/leagues/${league.slug}`,
          })),
        }}
      />

      <EsportsBreadcrumb items={[{ name: "Leagues", href: "/esports/leagues" }]} />

      <header className="mb-8">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          Esports Leagues
        </h1>
        <p className="mt-2 max-w-2xl text-text-body">
          Every league Riot publishes, by region. Each one keeps its own standings, schedule and
          results.
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          League data is temporarily unavailable. Nothing is broken on your side — try again
          shortly.
        </p>
      ) : (
        <div className="grid gap-8">
          {groups.map(([region, regionLeagues]) => (
            <section key={region}>
              <h2 className="hud-label mb-2.5">{regionLabel(region)}</h2>
              <LeagueGrid leagues={regionLeagues} />
            </section>
          ))}
        </div>
      )}

      <DataCredit className="mt-12" />
    </div>
  );
}
