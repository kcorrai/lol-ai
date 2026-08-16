import type { Metadata } from "next";
import Link from "next/link";
import { getVodArchive, archiveLeagues } from "@/domains/esports";
import type { VodSeries } from "@/domains/esports";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { VodSeriesCard } from "@/domains/esports/components/VodSeriesCard";

export const revalidate = 900; // The archive gains a series within hours of it being played.

interface PageProps {
  searchParams: { league?: string };
}

export function generateMetadata({ searchParams }: PageProps): Metadata {
  const league = searchParams.league;

  return {
    title: league
      ? `${league} VODs — Watch Every Recent Pro Game`
      : "LoL Esports VODs — Watch Every Recent Pro Game",
    description:
      "Every recently recorded League of Legends pro series, game by game, deep-linked to the moment each game starts. Filter by league and jump straight to the draft, scoreboard and gold curve.",
    alternates: { canonical: "/esports/vods" },
    // One archive at many query strings is one page (ADR-017 §3).
    robots: league ? { index: false, follow: true } : undefined,
  };
}

/** How many series a single page of the archive shows. */
const PAGE_SIZE = 40;

function countGames(series: VodSeries[]): number {
  return series.reduce((total, entry) => total + entry.games.length, 0);
}

export default async function EsportsVodsPage({
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const all = await getVodArchive();
  const leagues = archiveLeagues(all);

  const selected = searchParams.league;
  const filtered = selected ? all.filter((entry) => entry.leagueName === selected) : all;
  const shown = filtered.slice(0, PAGE_SIZE);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsJsonLd
        schema={{
          kind: "list",
          name: "Recent LoL esports VODs",
          items: shown.slice(0, 30).map((entry) => ({
            name: `${entry.teams[0]?.name ?? "TBD"} vs ${entry.teams[1]?.name ?? "TBD"} — ${entry.leagueName}`,
            href: `/esports/matches/${entry.matchId}`,
          })),
        }}
      />

      <EsportsBreadcrumb items={[{ name: "VODs", href: "/esports/vods" }]} />

      <header className="mb-6">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          Esports VODs
        </h1>
        <p className="mt-2 max-w-2xl text-text-body">
          Every recently recorded pro series, game by game. Each game opens on our match page with
          its draft, scoreboard and gold curve — and links out to the recording at the moment that
          game begins, rather than at the start of the broadcast.
        </p>
        {all.length > 0 && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-label text-text-muted">
            {all.length} series · {countGames(all)} recorded games · {leagues.length} leagues
          </p>
        )}
      </header>

      {leagues.length > 0 && (
        <nav aria-label="Filter by league" className="mb-8 flex flex-wrap gap-1.5">
          <Link
            href="/esports/vods"
            aria-current={selected ? undefined : "page"}
            className={`tag-cut px-3 py-1 font-mono text-[11px] uppercase tracking-label transition-colors ${
              selected
                ? "bg-surface-2 text-text-body hover:bg-surface hover:text-text"
                : "bg-accent text-background"
            }`}
          >
            All
          </Link>
          {leagues.map((league) => {
            const active = league.name === selected;
            return (
              <Link
                key={league.name}
                href={`/esports/vods?league=${encodeURIComponent(league.name)}`}
                aria-current={active ? "page" : undefined}
                className={`tag-cut px-3 py-1 font-mono text-[11px] uppercase tracking-label transition-colors ${
                  active
                    ? "bg-accent text-background"
                    : "bg-surface-2 text-text-body hover:bg-surface hover:text-text"
                }`}
              >
                {league.name}
                <span className="ml-1.5 opacity-60">{league.series}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {shown.length === 0 ? (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          {all.length === 0
            ? "Riot is publishing no recordings right now. The schedule and results are unaffected."
            : `No recorded series for ${selected} in the archive window.`}
        </p>
      ) : (
        <div className="grid gap-3">
          {shown.map((entry) => (
            <VodSeriesCard key={entry.matchId} series={entry} />
          ))}
        </div>
      )}

      {filtered.length > shown.length && (
        <p className="mt-6 text-sm text-text-muted">
          Showing the {PAGE_SIZE} most recent of {filtered.length}. Older games stay on each
          league&rsquo;s own page.
        </p>
      )}

      <p className="mt-12 text-sm text-text-muted">
        Watching something live instead?{" "}
        <Link href="/esports/schedule" className="text-accent hover:underline">
          The schedule
        </Link>{" "}
        carries every broadcast that is on right now.
      </p>

      <DataCredit className="mt-8" />
    </div>
  );
}
