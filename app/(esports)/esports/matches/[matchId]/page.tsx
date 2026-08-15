import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatch, defaultGame, getGameStats } from "@/domains/esports";
import type { GameTeamStats, MatchDetail, MatchGameRef } from "@/domains/esports";
import { DraftPanel } from "@/domains/esports/components/DraftPanel";
import { Scoreboard } from "@/domains/esports/components/Scoreboard";
import { LiveGameStats } from "@/domains/esports/components/LiveGameStats";
import { DataCredit } from "@/domains/esports/components/DataCredit";
import { EsportsBreadcrumb } from "@/domains/esports/components/EsportsBreadcrumb";

// An hour for the series shell. Completed game stats behind it are immutable and
// cached for a month; a live game refreshes on its own thirty-second window.
export const revalidate = 3600;

interface PageProps {
  params: { matchId: string };
  searchParams: { g?: string };
}

function seriesTitle(match: MatchDetail): string {
  const [home, away] = match.teams;
  return `${home?.name ?? "TBD"} vs ${away?.name ?? "TBD"} — ${match.league.name}`;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const match = await getMatch(params.matchId);
  if (!match) return { title: "Match not found" };

  const [home, away] = match.teams;
  const decided = home && away && home.gameWins + away.gameWins > 0;

  return {
    title: seriesTitle(match),
    description: decided
      ? `${home.name} ${home.gameWins}-${away.gameWins} ${away.name} in the ${match.league.name}: full result, drafts and player stats for every game.`
      : `${home?.name ?? "TBD"} vs ${away?.name ?? "TBD"} in the ${match.league.name}: drafts, scoreboards and player stats.`,
    alternates: { canonical: `/esports/matches/${match.matchId}` },
    // Per-game views are the same series at a second URL (ADR-017 §3).
    robots: searchParams.g ? { index: false, follow: true } : undefined,
  };
}

function GameSwitcher({
  match,
  activeId,
}: {
  match: MatchDetail;
  activeId: string;
}): React.ReactElement | null {
  const playable = match.games.filter((game) => game.state !== "unneeded");
  if (playable.length < 2) return null;

  return (
    <nav aria-label="Games in this series" className="mb-6 flex flex-wrap gap-1.5">
      {playable.map((game) => {
        const active = game.id === activeId;
        return (
          <Link
            key={game.id}
            href={
              game.number === 1
                ? `/esports/matches/${match.matchId}`
                : `/esports/matches/${match.matchId}?g=${game.number}`
            }
            aria-current={active ? "page" : undefined}
            className={`tag-cut px-3 py-1 font-mono text-[11px] uppercase tracking-label transition-colors ${
              active
                ? "bg-accent text-background"
                : "bg-surface-2 text-text-body hover:bg-surface hover:text-text"
            }`}
          >
            Game {game.number}
            {game.state === "inProgress" ? " · Live" : ""}
          </Link>
        );
      })}
    </nav>
  );
}

function SeriesHeader({ match }: { match: MatchDetail }): React.ReactElement {
  const [home, away] = match.teams;

  return (
    <header className="mb-6">
      <p className="hud-label mb-2">
        {match.league.name}
        {match.bestOf ? ` · Bo${match.bestOf}` : ""}
      </p>
      <div className="flex items-center justify-between gap-4">
        {[home, away].map((team, index) =>
          team ? (
            <div
              key={team.id}
              className={`flex min-w-0 flex-1 items-center gap-3 ${index === 1 ? "flex-row-reverse text-right" : ""}`}
            >
              {team.image && (
                <Image
                  src={team.image}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 object-contain"
                  aria-hidden
                  unoptimized
                />
              )}
              <h1 className="min-w-0 truncate font-display text-xl font-black uppercase text-text md:text-2xl">
                {team.name}
              </h1>
            </div>
          ) : (
            <span key={index} className="hud-label flex-1">
              TBD
            </span>
          )
        )}
        <span className="shrink-0 font-mono text-2xl font-bold text-text">
          {home?.gameWins ?? 0}
          <span className="mx-1.5 text-text-faint">–</span>
          {away?.gameWins ?? 0}
        </span>
      </div>
    </header>
  );
}

/**
 * Names the side that actually played it.
 *
 * The two feeds disagree. `getEventDetails` puts T1 on blue for game 1 of the
 * 2025 final; the livestats feed puts KT there — and livestats is the one whose
 * team id sits beside the five players it lists, so it wins. Trusting the event
 * payload here labels the draft with the wrong team on every match page.
 */
function sideName(match: MatchDetail, game: MatchGameRef, team: GameTeamStats): string {
  const fromGameData = team.teamId
    ? match.teams.find((entry) => entry.id === team.teamId)?.name
    : undefined;
  if (fromGameData) return fromGameData;

  const fallbackId = team.side === "blue" ? game.blueTeamId : game.redTeamId;
  return (
    match.teams.find((entry) => entry.id === fallbackId)?.name ??
    (team.side === "blue" ? "Blue side" : "Red side")
  );
}

export default async function MatchPage({
  params,
  searchParams,
}: PageProps): Promise<React.ReactElement> {
  const match = await getMatch(params.matchId);
  if (!match) notFound();

  const requested = searchParams.g
    ? match.games.find((game) => String(game.number) === searchParams.g)
    : null;
  const game = requested ?? defaultGame(match);

  const stats = game
    ? await getGameStats(game.id, { completed: game.state === "completed" })
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 md:py-14">
      <EsportsBreadcrumb
        items={[
          ...(match.league.slug
            ? [{ name: match.league.name, href: `/esports/leagues/${match.league.slug}` }]
            : []),
          { name: seriesTitle(match), href: `/esports/matches/${match.matchId}` },
        ]}
      />

      <SeriesHeader match={match} />
      {game && <GameSwitcher match={match} activeId={game.id} />}

      {!game && (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          This series has not started yet. Drafts and scoreboards appear here once the first game is
          under way.
        </p>
      )}

      {game && !stats && (
        <p className="gaming-card notch-sm px-4 py-5 text-sm text-text-muted">
          {game.state === "unstarted"
            ? "Game not started yet."
            : "Riot publishes no game stats for this match. The series result above is all that is recorded."}
        </p>
      )}

      {stats && game && !stats.finished && (
        // A game still being played refreshes itself; a finished one is static
        // and stays a server component.
        <LiveGameStats
          gameId={game.id}
          initial={stats}
          blueName={sideName(match, game, stats.blue)}
          redName={sideName(match, game, stats.red)}
        />
      )}

      {stats && game && stats.finished && (
        <>
          <section>
            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
                Draft
              </h2>
              <span className="hud-label">{stats.patch ? `Patch ${stats.patch}` : ""}</span>
            </div>
            <DraftPanel
              blue={stats.blue}
              red={stats.red}
              blueName={sideName(match, game, stats.blue)}
              redName={sideName(match, game, stats.red)}
            />
          </section>

          <section className="mt-12">
            <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
              Scoreboard
            </h2>
            <Scoreboard
              blue={stats.blue}
              red={stats.red}
              blueName={sideName(match, game, stats.blue)}
              redName={sideName(match, game, stats.red)}
            />
          </section>
        </>
      )}

      {match.league.slug && (
        <p className="mt-12 text-sm text-text-muted">
          More from the{" "}
          <Link
            href={`/esports/leagues/${match.league.slug}`}
            className="text-accent hover:underline"
          >
            {match.league.name}
          </Link>
          .
        </p>
      )}

      <DataCredit className="mt-8" />
    </div>
  );
}
