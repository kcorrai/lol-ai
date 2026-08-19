import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getPlayer,
  getPlayerGames,
  getTeamPlayerEntries,
  championPool,
  roleLabel,
} from "@/domains/esports";
import type { PlayerEntry, PlayerGame } from "@/domains/esports";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";
import { EsportsJsonLd } from "@/domains/esports/components/EsportsJsonLd";
import { kdaRatio } from "@/lib/kda";

export const revalidate = 86400;

interface PageProps {
  params: { slug: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const entry = await getPlayer(params.slug);
  if (!entry) return { title: "Player not found" };

  const { player, team } = entry;
  const role = roleLabel(player.role) ?? "Player";
  // The games walk is the same one the page body runs, and everything under it
  // is cached per match and per game — so asking twice costs cache reads, not
  // feed requests. It is the only way to know whether this page has anything on
  // it, and a page with nothing stays out of the index (ADR-017 §4).
  const games = await getPlayerGames(entry);

  return {
    title: `${player.handle} — ${team.name} ${player.role ?? ""} Stats & Champions`.replace(
      /\s+/g,
      " "
    ),
    description: `${player.handle}${player.fullName ? ` (${player.fullName})` : ""}, ${role} for ${team.name}: ${
      games.length > 0
        ? `champion pool from ${games.length} recorded ${games.length === 1 ? "game" : "games"}, recent games and team.`
        : "team, role and roster."
    }`,
    alternates: { canonical: `/esports/players/${entry.slug}` },
    robots: games.length === 0 ? { index: false, follow: true } : undefined,
  };
}

function kda(kills: number, deaths: number, assists: number): string {
  // The raw ratio, formatted here: rounding to two places first and then to one rounds twice.
  return kdaRatio(kills, deaths, assists).toFixed(1);
}

function PlayerHeader({ entry }: { entry: PlayerEntry }): React.ReactElement {
  const { player, team } = entry;

  return (
    <header className="mb-8 flex flex-wrap items-start gap-4">
      {player.image ? (
        <Image
          src={player.image}
          alt=""
          width={72}
          height={72}
          className="h-18 w-18 shrink-0 object-cover object-top"
          style={{ height: 72, width: 72 }}
          aria-hidden
          unoptimized
        />
      ) : (
        <span className="h-[72px] w-[72px] shrink-0 bg-surface-2" aria-hidden />
      )}
      <div className="min-w-0">
        <h1 className="font-display text-3xl font-black uppercase text-text md:text-4xl">
          {player.handle}
        </h1>
        <p className="mt-1 text-sm text-text-body">
          {player.fullName ? `${player.fullName} · ` : ""}
          {roleLabel(player.role) ?? "Substitute / staff"}
        </p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-label text-text-muted">
          <Link href={`/esports/teams/${team.slug}`} className="hover:text-accent">
            {team.name}
          </Link>
          {team.league ? ` · ${team.league.name}` : ""}
        </p>
      </div>
    </header>
  );
}

function ChampionPool({ games }: { games: PlayerGame[] }): React.ReactElement {
  const pool = championPool(games);

  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {pool.map((champion) => (
        <article
          key={champion.championId}
          className="gaming-card notch-sm flex items-center gap-3 px-3 py-2.5"
        >
          <ChampionIcon name={champion.championId} size={32} />
          <div className="min-w-0">
            <Link
              href={`/esports/champions/${champion.championId}`}
              className="block truncate font-display text-sm font-bold uppercase text-text hover:text-accent"
            >
              {champion.championId}
            </Link>
            <p className="truncate font-mono text-[11px] text-text-faint">
              {champion.games} {champion.games === 1 ? "game" : "games"} ·{" "}
              {kda(champion.kills, champion.deaths, champion.assists)} KDA
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

export default async function PlayerPage({ params }: PageProps): Promise<React.ReactElement> {
  const entry = await getPlayer(params.slug);
  if (!entry) notFound();

  const [games, roster] = await Promise.all([
    getPlayerGames(entry),
    getTeamPlayerEntries(entry.team.id),
  ]);
  const teammates = roster.filter((mate) => mate.player.id !== entry.player.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsJsonLd schema={{ kind: "player", entry }} />

      <EsportsBreadcrumb
        items={[
          { name: "Teams", href: "/esports/teams" },
          { name: entry.team.name, href: `/esports/teams/${entry.team.slug}` },
          { name: entry.player.handle, href: `/esports/players/${entry.slug}` },
        ]}
      />

      <PlayerHeader entry={entry} />

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Champion pool
          </h2>
          {games.length > 0 && (
            // Every table states its sample. A pool read from six games is not
            // the same claim as one read from a season, and the page says which.
            <span className="hud-label">
              from {games.length} recorded {games.length === 1 ? "game" : "games"}
            </span>
          )}
        </div>

        {games.length > 0 ? (
          <ChampionPool games={games} />
        ) : (
          <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
            No game data recorded for {entry.player.handle} in {entry.team.name}&apos;s recent
            series. Riot does not publish per-game stats for every league.
          </p>
        )}
      </section>

      {games.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Recent games
          </h2>
          <div className="gaming-card notch overflow-x-auto">
            <table className="w-full min-w-[26rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th scope="col" className="hud-label px-3 py-2 font-normal">
                    Champion
                  </th>
                  <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
                    KDA
                  </th>
                  <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
                    CS
                  </th>
                  <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
                    Game
                  </th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr
                    key={`${game.gameId}-${game.championId}`}
                    className="border-b border-border/60 last:border-0"
                  >
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2">
                        <ChampionIcon name={game.championId} size={24} />
                        <span className="truncate text-text">{game.championId}</span>
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-text">
                      {game.kills}/{game.deaths}/{game.assists}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-text-body">
                      {game.creepScore}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/esports/matches/${game.matchId}${game.gameNumber > 1 ? `?g=${game.gameNumber}` : ""}`}
                        className="font-mono text-[11px] text-accent hover:underline"
                      >
                        G{game.gameNumber}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {teammates.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Teammates
          </h2>
          <div className="flex flex-wrap gap-1.5">
            {teammates.map((mate) => (
              <Link
                key={mate.player.id}
                href={`/esports/players/${mate.slug}`}
                className="tag-cut bg-surface-2 px-2.5 py-1 font-mono text-[11px] uppercase tracking-label text-text-body transition-colors hover:bg-surface hover:text-text"
              >
                {mate.player.handle}
              </Link>
            ))}
          </div>
        </section>
      )}

      <DataCredit className="mt-12" />
    </div>
  );
}
