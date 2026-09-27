import Image from "next/image";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import { championSplashUrl } from "@/lib/ddragon";
import { tierChipClass, tierLetter } from "@/domains/meta/tierLetter";
import { formatCount } from "@/lib/uiLocale";
import type { PositionStats } from "@/domains/meta/types";

interface CounterSubjectProps {
  championKey: string;
  name: string;
  laneLabel: string;
  gamePatch: string;
  stats: PositionStats;
  /** The page's h1 when the band is the page's hero; an h2 under a tool header otherwise. */
  heading: "h1" | "h2";
  title: string;
}

/**
 * The champion a counter list is about, over its splash: lane, tier and the four numbers that say
 * how strong it is before the reader looks at who beats it. A 48% champion and a 53% one are very
 * different problems, and the list alone never said which one you were facing.
 */
export function CounterSubject({
  championKey,
  name,
  laneLabel,
  gamePatch,
  stats,
  heading: Heading,
  title,
}: CounterSubjectProps): React.ReactElement {
  const letter = tierLetter(stats.tier);
  return (
    <section className="notch relative mb-6 overflow-hidden border border-border">
      <Image
        src={championSplashUrl(championKey)}
        alt=""
        aria-hidden
        fill
        priority
        sizes="(max-width: 1240px) 100vw, 1240px"
        className="object-cover object-[62%_20%] opacity-[0.45]"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-r from-surface-dark from-[22%] via-[rgba(6,10,9,0.6)] via-[70%] to-[rgba(6,10,9,0.2)]" />
      <div className="bg-scanline absolute inset-0" />

      <div className="relative flex min-h-[180px] flex-wrap items-end justify-between gap-6 px-5 py-6 md:px-7">
        <div className="flex items-center gap-4">
          <ChampionIcon name={championKey} size={60} />
          <div>
            <Heading className="font-display text-[28px] font-black uppercase leading-none tracking-[0.02em] text-text md:text-[38px]">
              {title}
            </Heading>
            <div className="mt-2.5 flex flex-wrap items-center gap-2.5">
              <span
                className={`tag-cut inline-grid h-[24px] min-w-[24px] place-items-center border px-1 font-mono text-[12px] font-bold ${tierChipClass(letter)}`}
                title={`${letter}-tier ${laneLabel}`}
              >
                {letter}
              </span>
              <span className="hud-label text-[10.5px] text-text-body">
                {name} · {laneLabel} · patch {gamePatch}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-7 pb-1">
          <StatBlock
            label="Win rate"
            value={`${stats.winRate.toFixed(1)}%`}
            deltaTone={stats.winRate >= 50 ? "good" : "bad"}
          />
          <StatBlock label="Pick" value={`${stats.pickRate.toFixed(1)}%`} />
          <StatBlock label="Ban" value={`${stats.banRate.toFixed(1)}%`} />
          <StatBlock label="Games" value={formatCount(stats.games)} />
        </div>
      </div>
    </section>
  );
}
