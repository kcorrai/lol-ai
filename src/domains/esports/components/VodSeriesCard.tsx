import Image from "next/image";
import Link from "next/link";
import { MatchTime } from "@/domains/esports/components/MatchTime";
import { archiveLink } from "@/domains/esports/watch";
import type { ArchivedGame, VodSeries } from "@/domains/esports/types";

/**
 * One recorded series in the archive: who played, and a chip per game.
 *
 * Every chip goes to our own match page for that game, which is the honest
 * destination — the archive endpoint publishes a video id with no provider, so
 * only the match page can be sure where a numeric id actually lives. Where the
 * id is unambiguously YouTube a direct, offset-deep-linked "watch" link sits
 * beside it; where it is not, the match page carries the correct one.
 */

function gameHref(matchId: string, game: ArchivedGame): string {
  return game.number === 1
    ? `/esports/matches/${matchId}`
    : `/esports/matches/${matchId}?g=${game.number}`;
}

function GameChip({ matchId, game }: { matchId: string; game: ArchivedGame }): React.ReactElement {
  const direct = game.videoIds.map((id) => archiveLink(id, game.startMillis)).find(Boolean) ?? null;

  return (
    <span className="tag-cut inline-flex items-stretch overflow-hidden bg-surface-2">
      <Link
        href={gameHref(matchId, game)}
        className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-label text-text-body transition-colors hover:bg-surface hover:text-text"
      >
        Game {game.number}
      </Link>
      {direct && (
        <a
          href={direct}
          target="_blank"
          rel="noopener noreferrer"
          // Only the offset differs between this and the match page's own link;
          // both open on the game rather than the start of the broadcast.
          className="border-l border-border px-2 py-1 font-mono text-[11px] uppercase tracking-label text-accent transition-colors hover:bg-accent hover:text-background"
          aria-label={`Watch game ${game.number} on YouTube`}
        >
          ▸
        </a>
      )}
    </span>
  );
}

export function VodSeriesCard({ series }: { series: VodSeries }): React.ReactElement {
  const [home, away] = series.teams;

  return (
    <article className="gaming-card notch-sm px-4 py-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="hud-label">
          {series.leagueName}
          {series.blockName ? ` · ${series.blockName}` : ""}
          {series.bestOf ? ` · Bo${series.bestOf}` : ""}
        </p>
        <MatchTime startTime={series.startTime} withDate className="hud-label" />
      </div>

      <Link
        href={`/esports/matches/${series.matchId}`}
        className="flex items-center gap-3 hover:text-accent"
      >
        {[home, away].map((team, index) => (
          <span
            key={`${team?.code ?? "tbd"}-${index}`}
            className={`flex min-w-0 flex-1 items-center gap-2 ${
              index === 1 ? "flex-row-reverse text-right" : ""
            }`}
          >
            {team?.image && (
              <Image
                src={team.image}
                alt=""
                width={24}
                height={24}
                className="h-6 w-6 shrink-0 object-contain"
                aria-hidden
                unoptimized
              />
            )}
            <span className="min-w-0 truncate font-display text-sm font-bold uppercase text-text">
              {team?.name ?? "TBD"}
            </span>
          </span>
        ))}
        <span className="shrink-0 font-mono text-sm font-bold text-text">
          {home?.gameWins ?? 0}
          <span className="mx-1 text-text-faint">–</span>
          {away?.gameWins ?? 0}
        </span>
      </Link>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {series.games.map((game) => (
          <GameChip key={game.id} matchId={series.matchId} game={game} />
        ))}
      </div>
    </article>
  );
}
