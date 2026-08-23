import Link from "next/link";
import { getCachedProBuild } from "@/domains/esports";
import { fetchItems } from "@/lib/ddragon/itemsData";
import { ItemIcon } from "@/components/ui/ItemIcon";

const ITEMS_IN_LINE = 4;
const GAMES_LISTED = 3;

/**
 * How pro play sees a champion, on a page that is not about pro play.
 *
 * Two rules hold this together. It reads the pro sample **only if it is already
 * cached** — a ranked build page must never wait on a walk of the esports feed
 * to answer a question about ranked. And it renders nothing at all when the
 * champion has no pro games, rather than an empty box explaining its own
 * absence on a page nobody came to for esports.
 */
export async function ProPlayStrip({
  championId,
  name,
  variant = "full",
}: {
  championId: string;
  name: string;
  /** "line" is the one-sentence form for pages with no room for a panel. */
  variant?: "full" | "line";
}): Promise<React.ReactElement | null> {
  const result = await getCachedProBuild(championId);
  if (!result || result.build.games === 0) return null;

  const { build, meta } = result;
  const winRate = Math.round((build.wins / build.games) * 100);
  const pickRate = meta.games > 0 ? Math.round((build.games / meta.games) * 100) : 0;
  const href = `/esports/champions/${build.championId}`;

  if (variant === "line") {
    return (
      <p className="text-sm text-text-muted">
        Pros have picked {name} in {build.games} of the last {meta.games} recorded games ({pickRate}
        %), winning {winRate}% of them.{" "}
        <Link href={href} className="text-accent hover:underline">
          See the pro build
        </Link>
        .
      </p>
    );
  }

  const items = await fetchItems().catch(() => new Map());
  const core = build.items.slice(0, ITEMS_IN_LINE);

  return (
    <section className="gaming-card notch px-4 py-4">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-lg font-extrabold uppercase text-text">
          How pros build {name}
        </h2>
        <span className="hud-label">
          {build.games} pro {build.games === 1 ? "game" : "games"} · {pickRate}% picked · {winRate}%
          win
        </span>
      </div>

      {core.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {core.map((item) => (
            <span key={item.itemId} className="flex items-center gap-1.5">
              <ItemIcon itemId={item.itemId} size={26} />
              <span className="font-mono text-[11px] text-text-faint">
                {Math.round((item.games / build.games) * 100)}%
              </span>
            </span>
          ))}
          <span className="text-xs text-text-faint">
            {items.get(core[0].itemId)?.name ?? ""} most often
          </span>
        </div>
      )}

      {build.recentGames.length > 0 && (
        <ul className="mb-3 grid gap-1">
          {build.recentGames.slice(0, GAMES_LISTED).map((game) => (
            <li
              key={`${game.matchId}-${game.gameNumber}-${game.handle}`}
              className="flex flex-wrap items-baseline gap-x-2 text-xs text-text-muted"
            >
              <span className="text-text">{game.handle}</span>
              <span>{game.teamName ?? ""}</span>
              <span className="font-mono">
                {game.kills}/{game.deaths}/{game.assists}
              </span>
              <span className={game.won ? "text-accent" : ""}>
                {game.won === null ? "" : game.won ? "Win" : "Loss"}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Deliberately one-directional and explicit about the difference: a pro
          build is not advice for solo queue, it is a different question with a
          different answer. */}
      <Link href={href} className="text-sm text-accent hover:underline">
        Full pro build, runes and skill order →
      </Link>
    </section>
  );
}
