import { formatDuration } from "@/domains/esports/duration";
import type { ProChampionAverages } from "@/domains/esports/types";

/**
 * The average pro line on a champion, stated plainly.
 *
 * The whole line was already being computed and only ever reached a reader
 * through "You vs the Pros", which needs a Riot ID before it shows anything.
 * Someone who just wants to know what a pro game on this champion looks like
 * should not have to hand over an account to find out.
 *
 * Per-game and per-minute figures sit side by side deliberately: pro games run
 * long, so a per-game CS figure flatters the champion against solo queue and the
 * rate is the number that survives the comparison.
 */

interface Stat {
  label: string;
  value: string;
  /** Said under the number when the figure needs a qualifier. */
  note?: string;
}

/**
 * Grouped with a comma, always.
 *
 * A bare `toLocaleString()` follows the *server's* locale, and these pages are
 * server-rendered and cached — so a host set to a European locale ships 16,320
 * gold to every reader as "16.320", which reads as sixteen. Caught in a browser.
 */
function integer(value: number | null): string {
  return value === null ? "—" : Math.round(value).toLocaleString("en-US");
}

function rate(value: number | null, digits = 1): string {
  return value === null ? "—" : value.toFixed(digits);
}

function percent(fraction: number | null): string {
  return fraction === null ? "—" : `${Math.round(fraction * 100)}%`;
}

function stats(averages: ProChampionAverages): Stat[] {
  return [
    {
      label: "KDA",
      value: `${averages.kills.toFixed(1)} / ${averages.deaths.toFixed(1)} / ${averages.assists.toFixed(1)}`,
      note: `${averages.kda.toFixed(2)} ratio`,
    },
    { label: "CS", value: integer(averages.creepScore), note: `${rate(averages.creepScorePerMin)} per min` },
    {
      label: "Gold",
      value: integer(averages.gold),
      note: `${rate(averages.goldPerMin, 0)} per min`,
    },
    {
      label: "Game length",
      // Derived from the feed's own opening and closing frames, not published.
      value: formatDuration(averages.gameLengthSeconds),
      note: "mean of the sample",
    },
    { label: "Kill participation", value: percent(averages.killParticipation) },
    { label: "Damage share", value: percent(averages.damageShare) },
    {
      label: "Wards",
      value: integer(averages.wardsPlaced),
      note: `${integer(averages.wardsDestroyed)} killed`,
    },
    { label: "Win rate", value: `${Math.round(averages.winRate)}%` },
  ];
}

export function ProAverages({
  averages,
  games,
}: {
  averages: ProChampionAverages;
  games: number;
}): React.ReactElement {
  return (
    <section className="mt-12">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          The average pro game
        </h2>
        <span className="hud-label">
          Per game over {games} {games === 1 ? "game" : "games"}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats(averages).map((stat) => (
          <div key={stat.label} className="gaming-card notch-sm px-3 py-3">
            <dt className="hud-label text-[10px]">{stat.label}</dt>
            <dd className="mt-1 font-mono text-lg font-bold text-text">{stat.value}</dd>
            {stat.note && (
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-label text-text-muted">
                {stat.note}
              </p>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}
