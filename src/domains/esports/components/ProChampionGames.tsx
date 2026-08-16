import Link from "next/link";
import { ItemIcon } from "@/components/ui/ItemIcon";
import type { ProGameAppearance, ProPlayerOnChampion } from "@/domains/esports/types";

const ITEMS_SHOWN = 6;

function Result({ won }: { won: boolean | null }): React.ReactElement {
  if (won === null) return <span className="text-text-faint">—</span>;
  return (
    <span className={won ? "text-accent" : "text-text-muted"}>{won ? "Win" : "Loss"}</span>
  );
}

export function TopPlayers({
  players,
  slugFor,
}: {
  players: ProPlayerOnChampion[];
  slugFor: (handle: string) => string | undefined;
}): React.ReactElement | null {
  if (players.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
        Who plays it
      </h2>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {players.map((player) => {
          const slug = slugFor(player.handle);
          return (
            <article
              key={player.handle}
              className="gaming-card notch-sm flex items-baseline justify-between gap-3 px-3 py-2.5"
            >
              <span className="min-w-0">
                {slug ? (
                  <Link
                    href={`/esports/players/${slug}`}
                    className="block truncate font-display text-sm font-bold uppercase text-text hover:text-accent"
                  >
                    {player.handle}
                  </Link>
                ) : (
                  <span className="block truncate font-display text-sm font-bold uppercase text-text">
                    {player.handle}
                  </span>
                )}
                <span className="block truncate font-mono text-[11px] text-text-faint">
                  {player.teamName ?? "—"}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-text-body">
                {player.games} {player.games === 1 ? "game" : "games"} · {player.wins}–
                {player.games - player.wins}
              </span>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export function RecentProGames({
  games,
}: {
  games: ProGameAppearance[];
}): React.ReactElement | null {
  if (games.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
        Recent pro games
      </h2>
      <div className="gaming-card notch overflow-x-auto">
        <table className="w-full min-w-[32rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="hud-label px-3 py-2 font-normal">
                Player
              </th>
              <th scope="col" className="hud-label px-3 py-2 font-normal">
                Against
              </th>
              <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
                KDA
              </th>
              <th scope="col" className="hud-label px-3 py-2 font-normal">
                Finished with
              </th>
              <th scope="col" className="hud-label px-3 py-2 text-right font-normal">
                Result
              </th>
            </tr>
          </thead>
          <tbody>
            {games.map((game) => (
              <tr
                key={`${game.matchId}-${game.gameNumber}-${game.handle}`}
                className="border-b border-border/60 last:border-0"
              >
                <td className="px-3 py-2">
                  <span className="block truncate text-text">{game.handle}</span>
                  <span className="block truncate font-mono text-[11px] text-text-faint">
                    {game.teamName ?? "—"}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className="block truncate text-text-body">{game.opponentName ?? "—"}</span>
                  <span className="block truncate font-mono text-[11px] text-text-faint">
                    {game.leagueName}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-text">
                  {game.kills}/{game.deaths}/{game.assists}
                </td>
                <td className="px-3 py-2">
                  <span className="flex gap-1">
                    {game.items.slice(0, ITEMS_SHOWN).map((itemId, index) => (
                      <ItemIcon key={`${itemId}-${index}`} itemId={itemId} size={22} />
                    ))}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-right font-mono text-[11px]">
                  <Result won={game.won} />
                  <Link
                    href={`/esports/matches/${game.matchId}${game.gameNumber > 1 ? `?g=${game.gameNumber}` : ""}`}
                    className="ml-2 text-accent hover:underline"
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
  );
}
