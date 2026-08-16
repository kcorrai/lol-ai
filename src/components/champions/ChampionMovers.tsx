import Image from "next/image";
import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { championSplashUrl } from "@/lib/ddragon";

export interface ChampionMover {
  key: string;
  name: string;
  href: string;
  group: string;
  winRate: number;
  games: number;
  /** Places moved since last patch. Positive is a climb. */
  delta: number;
}

/**
 * The champions whose standing moved most this patch.
 *
 * The movement is rank movement, not a win-rate delta: the meta snapshot stores last patch's
 * ordinal, not last patch's win rate, so a climb of N places is the honest figure to print.
 */
export function ChampionMovers({ movers }: { movers: ChampionMover[] }): React.ReactElement | null {
  if (movers.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="h-1.5 w-1.5 bg-accent motion-safe:animate-pulse" aria-hidden />
        <span className="font-mono text-[11px] uppercase tracking-label text-text">
          Moved most this patch
        </span>
        <span className="hidden h-px flex-1 bg-line-1 sm:block" />
        <span className="hud-label text-[10.5px]">If you play these, your old build is stale</span>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {movers.map((mover) => {
          const climbed = mover.delta > 0;
          return (
            <Link
              key={mover.key}
              href={mover.href}
              className={`notch relative block min-h-[208px] overflow-hidden border transition-colors ${
                climbed ? "glow-accent-soft border-accent" : "border-border hover:border-accent/40"
              }`}
            >
              <Image
                src={championSplashUrl(mover.key)}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                className="object-cover object-[52%_14%] opacity-30"
                unoptimized
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface-dark from-[18%] to-[rgba(6,10,9,0.24)]" />

              <div className="relative flex h-full flex-col justify-between gap-5 p-4">
                <div className="flex items-center justify-between gap-2.5">
                  <span className="hud-label text-[10px] text-text-body">{mover.group}</span>
                  <span
                    className={`tag-cut border px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-label ${
                      climbed
                        ? "border-accent bg-accent/15 text-accent"
                        : "border-warning bg-warning/15 text-warning"
                    }`}
                  >
                    {climbed ? "▲" : "▼"}
                    {Math.abs(mover.delta)} places
                  </span>
                </div>

                <div>
                  <div className="flex items-center gap-2.5">
                    <ChampionIcon name={mover.key} size={36} />
                    <span className="truncate font-display text-[17px] font-extrabold uppercase tracking-[0.04em] text-text">
                      {mover.name}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    <span className="font-mono text-[22px] font-bold tabular-nums text-accent">
                      {mover.winRate.toFixed(1)}%
                    </span>
                    <span className="hud-label text-[10.5px]">
                      win · {mover.games >= 1000 ? `${Math.round(mover.games / 1000)}k` : mover.games} games
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
