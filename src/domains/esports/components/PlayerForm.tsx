import Link from "next/link";
import { StatBlock } from "@/domains/esports/components/StatBlock";
import { formPoints, playerFormSummary, type FormPoint } from "@/domains/esports/playerForm";
import type { PlayerGame } from "@/domains/esports/types";

/**
 * Where the bars top out. One deathless stomp can post a KDA of 20, and scaling
 * to it would flatten every other game into a stub, so the scale stops here and
 * a taller game is drawn full height with its number in the title.
 */
const KDA_CEILING = 10;

const RESULT_FILL: Record<string, string> = {
  win: "bg-accent",
  loss: "bg-danger",
  unknown: "bg-text-muted",
};

function resultKey(won: boolean | null): string {
  return won === null ? "unknown" : won ? "win" : "loss";
}

function barTitle(point: FormPoint): string {
  const result = point.won === null ? "" : point.won ? " · win" : " · loss";
  return `G${point.gameNumber} ${point.championId} — KDA ${point.kda.toFixed(1)}${result}`;
}

/**
 * A pro's recent form: the record, three averages, and one bar per game.
 *
 * Bars run oldest to newest, as a league table's form column does, with the
 * average drawn across them so a run above or below it reads at a glance.
 */
export function PlayerForm({ games }: { games: PlayerGame[] }): React.ReactElement | null {
  if (games.length === 0) return null;

  const summary = playerFormSummary(games);
  const points = formPoints(games);
  const scale = Math.min(
    KDA_CEILING,
    Math.max(...points.map((point) => point.kda), summary.kda, 1)
  );
  const decided = summary.games - summary.unknown;

  return (
    <section className="mb-12">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          Recent form
        </h2>
        <span className="hud-label">
          {summary.games} {summary.games === 1 ? "game" : "games"}
        </span>
      </div>

      <div className="gaming-card notch-sm px-4 py-4">
        <div className="flex flex-wrap gap-x-8 gap-y-4">
          {decided > 0 && (
            <span data-spoiler="">
              <StatBlock
                label="Record"
                value={`${summary.wins}–${decided - summary.wins}`}
                unit="games"
              />
            </span>
          )}
          <StatBlock label="KDA" value={summary.kda.toFixed(2)} />
          <StatBlock
            label="CS / min"
            value={summary.csPerMin === null ? "—" : summary.csPerMin.toFixed(1)}
          />
          <StatBlock
            label="Kill part."
            value={
              summary.killParticipation === null
                ? "—"
                : `${Math.round(summary.killParticipation * 100)}%`
            }
          />
        </div>

        <div className="relative mt-5 h-24 border-b border-border">
          <div
            className="absolute inset-x-0 border-t border-dashed border-text-muted"
            style={{ bottom: `${(Math.min(summary.kda, scale) / scale) * 100}%` }}
            aria-hidden
          >
            <span className="absolute -top-4 right-0 bg-surface px-1 font-mono text-[11px] text-text-muted">
              avg {summary.kda.toFixed(1)}
            </span>
          </div>
          <div className="flex h-full items-end gap-1">
            {points.map((point) => (
              <Link
                key={point.gameId}
                href={`/esports/matches/${point.matchId}${point.gameNumber > 1 ? `?g=${point.gameNumber}` : ""}`}
                title={barTitle(point)}
                aria-label={barTitle(point)}
                className={`min-w-[4px] flex-1 opacity-80 transition-opacity hover:opacity-100 ${RESULT_FILL[resultKey(point.won)]}`}
                style={{ height: `${Math.max(4, (Math.min(point.kda, scale) / scale) * 100)}%` }}
                data-spoiler-outcome={point.won === null ? undefined : "fill"}
              />
            ))}
          </div>
        </div>
        <p className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-[11px] text-text-muted">
          <span>KDA per game, oldest → newest</span>
          <span>
            <span className="text-accent">■</span> win · <span className="text-danger">■</span> loss
          </span>
        </p>
      </div>
    </section>
  );
}
