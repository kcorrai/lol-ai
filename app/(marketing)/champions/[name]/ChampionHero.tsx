import Image from "next/image";
import { championSplashUrl } from "@/lib/ddragon";
import { StatBlock } from "@/components/dashboard/laneiq/HudPanel";
import { tierLetter } from "@/domains/meta/tierLetter";
import type { ChampionMetaStats } from "@/domains/meta";

interface ChampionHeroProps {
  championKey: string;
  name: string;
  title: string;
  tags: string[];
  difficulty: number;
  meta: ChampionMetaStats | null;
  laneLabel: string | null;
}

function difficultyLabel(value: number): string {
  return value >= 7 ? "High" : value >= 4 ? "Moderate" : "Low";
}

/** Splash, name and the numbers that say whether this champion is worth learning right now. */
export function ChampionHero({
  championKey,
  name,
  title,
  tags,
  difficulty,
  meta,
  laneLabel,
}: ChampionHeroProps): React.ReactElement {
  return (
    <section className="relative flex min-h-[300px] items-end overflow-hidden border-b border-line-1 md:min-h-[360px]">
      <Image
        src={championSplashUrl(championKey)}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-[58%_22%] opacity-50"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-r from-surface-dark from-[20%] via-[rgba(6,10,9,0.58)] via-[66%] to-[rgba(6,10,9,0.2)]" />
      <div className="bg-scanline absolute inset-0 bg-gradient-to-t from-background from-[2%] to-transparent to-[42%]" />

      <div className="relative mx-auto flex w-full max-w-[1240px] flex-wrap items-end justify-between gap-7 px-5 pb-6 pt-14 md:px-8">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">{title}</p>
          <h1 className="mt-2.5 font-display text-[44px] font-black uppercase leading-[0.9] tracking-[0.02em] text-text md:text-[72px]">
            {name}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="tag-cut border border-line-2 bg-surface px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-label text-text-body"
              >
                {tag}
              </span>
            ))}
            <span className="ml-1.5 font-mono text-[10.5px] uppercase tracking-label text-text-body">
              Difficulty · {difficultyLabel(difficulty)}
            </span>
          </div>
        </div>

        {meta && (
          <div className="flex flex-wrap gap-7 pb-0.5">
            <StatBlock
              label="Win rate"
              value={`${meta.overallWinRate.toFixed(1)}%`}
              deltaTone={meta.overallWinRate >= 50 ? "good" : "bad"}
            />
            <StatBlock
              label="Tier"
              value={tierLetter(meta.overallTier)}
              unit={laneLabel ?? undefined}
            />
            <StatBlock label="Pick" value={`${meta.overallPickRate.toFixed(1)}%`} />
            <StatBlock label="Ban" value={`${meta.overallBanRate.toFixed(1)}%`} />
          </div>
        )}
      </div>
    </section>
  );
}
