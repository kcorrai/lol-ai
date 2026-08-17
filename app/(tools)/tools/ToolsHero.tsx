import Link from "next/link";
import { FEATURED } from "./toolIndex";
import { championSplashUrl } from "@/lib/ddragon";

interface HeroStat {
  label: string;
  value: string;
  unit?: string;
}

interface ToolsHeroProps {
  stats: HeroStat[];
}

/**
 * The flagship tool is not a card in a grid.
 *
 * Draft Room is the one thing here nothing else on the internet does, and a
 * ten-up grid buries it beside the tier list. It gets the hero slot and a
 * splash; everything else earns its place in the index below.
 */
export function ToolsHero({ stats }: ToolsHeroProps): React.JSX.Element {
  return (
    <section className="grid items-stretch gap-5 lg:grid-cols-[1.1fr_1fr]">
      <div>
        <div className="flex items-center gap-2.5 font-mono text-[10.5px] uppercase tracking-label text-acid-500">
          <span className="h-1.5 w-1.5 animate-glow-pulse bg-acid-500" />
          Free · no login · updated every patch
        </div>
        <h1 className="mt-3.5 font-display text-4xl font-black uppercase leading-none text-fg-1 md:text-[44px]">
          Free LoL tools
        </h1>
        <p className="mt-3 max-w-[52ch] text-[15px] text-fg-2">
          Counter picks, drafts, tier lists and builds — all from real ranked games. No account
          needed for any of it.
        </p>
        <div className="mt-5 flex flex-wrap gap-x-8 gap-y-4 border-t border-line-1 pt-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <div className="font-mono text-[9.5px] uppercase tracking-label text-fg-4">
                {stat.label}
              </div>
              <div className="mt-1 font-display text-xl font-bold tabular-nums text-fg-1">
                {stat.value}
                {stat.unit && (
                  <span className="ml-1.5 font-mono text-[10px] font-normal text-fg-3">
                    {stat.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Link
        href={FEATURED.href}
        className="notch glow-accent-soft relative block min-h-[230px] overflow-hidden border border-acid-500"
      >
        <span
          className="absolute inset-0 bg-cover opacity-30"
          style={{
            backgroundImage: `url('${championSplashUrl("Orianna")}')`,
            backgroundPosition: "52% 16%",
          }}
          aria-hidden
        />
        <span className="absolute inset-0 bg-gradient-to-t from-ink-1000 via-ink-1000/70 to-transparent" />
        <span className="relative flex h-full flex-col justify-between gap-5 px-6 py-5">
          <span className="font-mono text-[10px] uppercase tracking-label text-acid-500">
            {"// THE ONE WORTH OPENING FIRST"}
          </span>
          <span>
            <span className="block font-display text-3xl font-black uppercase leading-none text-fg-1">
              {FEATURED.title}
            </span>
            <span className="mt-2.5 block max-w-[40ch] text-[14.5px] text-fg-2">
              {FEATURED.description}
            </span>
            <span className="mt-4 flex items-center gap-5 font-mono text-[11px] uppercase tracking-wide text-acid-500">
              Open draft room →
            </span>
          </span>
        </span>
      </Link>
    </section>
  );
}
