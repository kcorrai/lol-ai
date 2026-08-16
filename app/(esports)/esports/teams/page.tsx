import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getTeams, indexableTeams } from "@/domains/esports";
import type { EsportsTeam } from "@/domains/esports";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";

export const revalidate = 86400; // Rosters change between splits, not daily.

export const metadata: Metadata = {
  title: "LoL Esports Teams — Rosters, Results & Schedule",
  description:
    "Every active League of Legends pro team by league: current roster, next match, recent results and form. T1, G2, Gen.G, Fnatic and hundreds more.",
  alternates: { canonical: "/esports/teams" },
};

function groupByLeague(teams: EsportsTeam[]): [string, EsportsTeam[]][] {
  const groups = new Map<string, EsportsTeam[]>();
  for (const team of teams) {
    const key = team.league?.name ?? "Other";
    const existing = groups.get(key);
    if (existing) existing.push(team);
    else groups.set(key, [team]);
  }
  // Biggest leagues first — a league with two listed teams is not what a reader
  // scanning this page is looking for.
  return [...groups.entries()].sort(([, a], [, b]) => b.length - a.length);
}

function TeamTile({ team }: { team: EsportsTeam }): React.ReactElement {
  return (
    <Link
      href={`/esports/teams/${team.slug}`}
      className="gaming-card notch-sm flex items-center gap-2.5 px-3 py-2.5 transition-colors hover:border-line-2"
    >
      {team.image ? (
        <Image
          src={team.image}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 object-contain"
          aria-hidden
          unoptimized
        />
      ) : (
        <span className="h-6 w-6 shrink-0" aria-hidden />
      )}
      <span className="min-w-0">
        <span className="block truncate font-display text-sm font-bold uppercase text-text">
          {team.name}
        </span>
        <span className="block truncate font-mono text-[11px] text-text-faint">{team.code}</span>
      </span>
    </Link>
  );
}

export default async function EsportsTeamsPage(): Promise<React.ReactElement> {
  const listed = indexableTeams(await getTeams());
  const groups = groupByLeague(listed);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: "League of Legends pro teams",
          items: listed.map((team) => ({
            name: team.name,
            href: `/esports/teams/${team.slug}`,
          })),
        }}
      />

      <EsportsBreadcrumb items={[{ name: "Teams", href: "/esports/teams" }]} />

      <header className="mb-8">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          Esports Teams
        </h1>
        <p className="mt-2 max-w-2xl text-text-body">
          Every active pro team with a published roster, by league. Each page keeps the current
          lineup, the next match and recent form.
        </p>
      </header>

      {groups.length === 0 ? (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          Team data is temporarily unavailable. Nothing is broken on your side — try again shortly.
        </p>
      ) : (
        <div className="grid gap-8">
          {groups.map(([league, teams]) => (
            <section key={league}>
              <h2 className="hud-label mb-2.5">
                {league}
                <span className="ml-2 text-text-faint">{teams.length}</span>
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                {teams.map((team) => (
                  <TeamTile key={team.id} team={team} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <DataCredit className="mt-12" />
    </div>
  );
}
