import Link from "next/link";
import type { MatchDetail } from "@/domains/esports";

interface SeriesRailProps {
  match: MatchDetail;
  activeGameId: string | null;
}

const STATE_LABEL: Record<string, string> = {
  completed: "Final",
  inProgress: "Live",
  unstarted: "Upcoming",
};

/**
 * The series as a list, beside the game being read.
 *
 * Game tabs above the fold answer "which one am I looking at"; this answers
 * "what else is there", which is the question someone arriving from a result
 * actually has.
 */
export function SeriesRail({ match, activeGameId }: SeriesRailProps): React.JSX.Element {
  const playable = match.games.filter((game) => game.state !== "unneeded");

  return (
    <div className="grid gap-3.5 lg:sticky lg:top-4">
      {playable.length > 1 && (
        <section className="notch border border-border bg-surface">
          <div className="border-b border-line-1 px-4 py-3 font-mono text-[10px] uppercase tracking-label text-text-muted">
            {"// SERIES"}
          </div>
          {playable.map((game) => {
            const active = game.id === activeGameId;
            return (
              <Link
                key={game.id}
                href={
                  game.number === 1
                    ? `/esports/matches/${match.matchId}`
                    : `/esports/matches/${match.matchId}?g=${game.number}`
                }
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 border-b border-l-2 border-line-1 px-4 py-2.5 transition-colors last:border-b-0 ${
                  active
                    ? "border-l-acid-500 bg-acid-500/10"
                    : "border-l-transparent hover:bg-surface-2"
                }`}
              >
                <span
                  className={`font-mono text-[11px] uppercase tracking-wide ${
                    active ? "text-fg-1" : "text-fg-3"
                  }`}
                >
                  Game {game.number}
                </span>
                <span
                  className={`ml-auto font-mono text-[10px] uppercase tracking-wide ${
                    game.state === "inProgress" ? "text-danger" : "text-fg-4"
                  }`}
                >
                  {STATE_LABEL[game.state] ?? game.state}
                </span>
              </Link>
            );
          })}
        </section>
      )}

      <section className="notch border border-border bg-surface px-4 pb-6 pt-4">
        <div className="font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-fg-1">
          Steal this draft
        </div>
        <p className="mb-3 mt-2 text-[12.5px] text-fg-2">
          Put a pro comp through the same analyzer you use on your own ranked drafts.
        </p>
        <Link
          href="/tools/draft-analyzer"
          className="notch-sm inline-flex w-full items-center justify-center gap-2 border border-line-2 px-3 py-2 font-mono text-[10px] uppercase tracking-label text-fg-2 transition-colors hover:border-acid-500 hover:text-acid-500"
        >
          Open draft analyzer →
        </Link>
      </section>

      <section className="notch border border-border bg-surface px-4 pb-6 pt-4">
        <div className="font-display text-sm font-extrabold uppercase leading-tight tracking-wide text-fg-1">
          What the pros pick
        </div>
        <p className="mb-3 mt-2 text-[12.5px] text-fg-2">
          Pick and win rates across every league on the feed, this patch.
        </p>
        <Link
          href="/esports/champions"
          className="notch-sm inline-flex w-full items-center justify-center gap-2 border border-line-2 px-3 py-2 font-mono text-[10px] uppercase tracking-label text-fg-2 transition-colors hover:border-acid-500 hover:text-acid-500"
        >
          Pro champion meta →
        </Link>
      </section>
    </div>
  );
}
