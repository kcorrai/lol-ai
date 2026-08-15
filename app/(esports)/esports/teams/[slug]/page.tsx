import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getTeam,
  getTeams,
  getTeamMatches,
  getTeamPlayerEntries,
  indexableTeams,
  isThinTeam,
  recentForm,
} from "@/domains/esports";
import type { EsportsTeam } from "@/domains/esports";
import { MatchRow } from "@/domains/esports/components/MatchRow";
import { RosterCard } from "@/domains/esports/components/RosterCard";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";

export const revalidate = 86400;

interface PageProps {
  params: { slug: string };
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  // Only teams that pass the has-content bar; the rest render on demand.
  return indexableTeams(await getTeams()).map((team) => ({ slug: team.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const team = await getTeam(params.slug);
  if (!team) return { title: "Team not found" };

  const matches = await getTeamMatches(team);
  const league = team.league?.name;

  return {
    title: `${team.name} — Roster, Schedule & Results`,
    description: `${team.name}${league ? ` (${league})` : ""}: current roster, next match, recent results and form.`,
    alternates: { canonical: `/esports/teams/${team.slug}` },
    // A page with no roster and no matches is exactly the thin filler that gets
    // a large generated section filtered (ADR-017 §4). It still renders — the
    // reader who followed a link deserves an answer — but it stays out of the
    // index.
    robots: isThinTeam(team, [...matches.upcoming, ...matches.results])
      ? { index: false, follow: true }
      : undefined,
  };
}

function FormStrip({ form }: { form: ("W" | "L")[] }): React.ReactElement | null {
  if (form.length === 0) return null;

  // `form` arrives newest-first. Rendered left to right that reads backwards
  // against every league table people already know, so it is flipped: oldest on
  // the left, the most recent result nearest the label.
  const chronological = [...form].reverse();

  return (
    <span
      className="flex items-center gap-1"
      aria-label={`Form, oldest to most recent: ${chronological.join(", ")}`}
    >
      <span className="hud-label mr-1">Form</span>
      {chronological.map((result, index) => (
        <span
          key={index}
          aria-hidden
          className={`flex h-5 w-5 items-center justify-center font-mono text-[10px] font-bold ${
            result === "W" ? "bg-accent/15 text-accent" : "bg-surface-2 text-text-muted"
          }`}
        >
          {result}
        </span>
      ))}
    </span>
  );
}

function TeamHeader({
  team,
  form,
}: {
  team: EsportsTeam;
  form: ("W" | "L")[];
}): React.ReactElement {
  return (
    <header className="mb-8 flex flex-wrap items-start gap-4">
      {team.image && (
        <Image
          src={team.image}
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 shrink-0 object-contain"
          aria-hidden
          unoptimized
        />
      )}
      <div className="min-w-0 flex-1">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          {team.name}
        </h1>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-text-muted">
          {team.code}
          {team.league ? ` · ${team.league.name}` : ""}
          {team.status === "archived" ? " · Archived" : ""}
        </p>
      </div>
      <div className="mt-1">
        <FormStrip form={form} />
      </div>
    </header>
  );
}

export default async function TeamPage({ params }: PageProps): Promise<React.ReactElement> {
  const team = await getTeam(params.slug);
  if (!team) notFound();

  const [matches, playerEntries] = await Promise.all([
    getTeamMatches(team),
    getTeamPlayerEntries(team.id),
  ]);
  const form = recentForm(team, matches.results).slice(0, 5);
  const playerHref = new Map(
    playerEntries.map((entry) => [entry.player.id, `/esports/players/${entry.slug}`])
  );
  const starters = team.players.filter((player) => player.role !== null);
  const others = team.players.filter((player) => player.role === null);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsBreadcrumb
        items={[
          { name: "Teams", href: "/esports/teams" },
          { name: team.name, href: `/esports/teams/${team.slug}` },
        ]}
      />

      <TeamHeader team={team} form={form} />

      {team.status === "archived" && (
        <p className="gaming-card notch-sm mb-8 px-4 py-3 text-sm text-text-muted">
          This team is no longer active in Riot&apos;s published data. What follows is its last
          recorded roster and results.
        </p>
      )}

      {team.players.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Roster
          </h2>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {starters.map((player) => (
              <RosterCard key={player.id} player={player} href={playerHref.get(player.id)} />
            ))}
          </div>

          {others.length > 0 && (
            <>
              <h3 className="hud-label mb-2 mt-5">Substitutes &amp; staff</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {others.map((player) => (
                  <RosterCard key={player.id} player={player} href={playerHref.get(player.id)} />
                ))}
              </div>
            </>
          )}
        </section>
      )}

      {matches.upcoming.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Next matches
          </h2>
          <div className="grid gap-2">
            {matches.upcoming.map((event) => (
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

      {matches.results.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Recent results
          </h2>
          <div className="grid gap-2">
            {matches.results.map((event) => (
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

      {team.players.length === 0 &&
        matches.upcoming.length === 0 &&
        matches.results.length === 0 && (
          <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
            Riot publishes no roster or recent matches for this team. If it is competing again, this
            page fills in on its own.
          </p>
        )}

      {team.league && (
        <p className="mt-12 text-sm text-text-muted">
          See the full {team.league.name} standings and schedule on the{" "}
          <Link href="/esports/leagues" className="text-accent hover:underline">
            league pages
          </Link>
          .
        </p>
      )}

      <DataCredit className="mt-8" />
    </div>
  );
}
