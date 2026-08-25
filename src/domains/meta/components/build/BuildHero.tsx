import Image from "next/image";
import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { championSplashUrl } from "@/lib/ddragon";
import { POSITION_LABELS, POSITION_SLUG } from "@/domains/meta";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import type { CanonicalPosition, PositionStats } from "@/domains/meta";
import { formatCount } from "@/lib/uiLocale";

interface BuildHeroProps {
  championKey: string;
  name: string;
  laneLabel: string;
  gamePatch: string;
  intro: string;
  stats: PositionStats;
  position: CanonicalPosition;
  availablePositions: CanonicalPosition[];
  isAram: boolean;
}

const TAB = "tag-cut border px-3 py-1 font-mono text-[10.5px] uppercase tracking-label transition-colors";

/** Splash, name, lane tabs and the four numbers that decide whether to read on. */
export function BuildHero({
  championKey,
  name,
  laneLabel,
  gamePatch,
  intro,
  stats,
  position,
  availablePositions,
  isAram,
}: BuildHeroProps): React.ReactElement {
  return (
    <section className="relative overflow-hidden border-b border-line-1">
      <Image
        src={championSplashUrl(championKey)}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_24%] opacity-[0.42]"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-r from-surface-dark from-[26%] via-[rgba(6,10,9,0.55)] via-[78%] to-[rgba(6,10,9,0.25)]" />
      <div className="bg-scanline absolute inset-0" />

      <div className="relative mx-auto flex max-w-[1240px] flex-wrap items-end justify-between gap-7 px-5 py-7 md:px-8">
        <div>
          <div className="flex items-center gap-3.5">
            <ChampionIcon name={championKey} size={56} />
            <div>
              <h1 className="font-display text-[30px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[40px]">
                {name} build
              </h1>
              <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
                {!isAram && availablePositions.length > 1 && (
                  <div className="flex flex-wrap gap-1.5">
                    {availablePositions.map((pos) => (
                      <Link
                        key={pos}
                        href={`/builds/${championKey}/${POSITION_SLUG[pos]}`}
                        className={`${TAB} ${
                          pos === position
                            ? "border-accent bg-accent/15 text-accent"
                            : "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
                        }`}
                      >
                        {POSITION_LABELS[pos]}
                      </Link>
                    ))}
                  </div>
                )}
                <span className="hud-label text-[10.5px] text-text-body">
                  {isAram ? "ARAM" : laneLabel} · patch {gamePatch}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-4 max-w-[62ch] text-[15px] text-text-body">{intro}</p>
        </div>

        <div className="flex flex-wrap gap-7 pb-1">
          <StatBlock
            label="Win rate"
            value={`${stats.winRate.toFixed(1)}%`}
            deltaTone={stats.winRate >= 50 ? "good" : "bad"}
          />
          <StatBlock label="Pick" value={`${stats.pickRate.toFixed(1)}%`} />
          {!isAram && <StatBlock label="Ban" value={`${stats.banRate.toFixed(1)}%`} />}
          <StatBlock label="Games" value={formatCount(stats.games)} />
        </div>
      </div>
    </section>
  );
}
