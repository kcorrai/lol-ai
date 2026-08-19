import { SectionHead } from "./SectionHead";
import { HudStagger, HudStaggerItem } from "./motion";

/**
 * Replaces the pre-rebrand TestimonialsSection, which had no testimonials in it —
 * three claims about the product and a "free while we're in beta" panel that
 * stopped being true. A data product's honest differentiator is where its numbers
 * come from, so that is what this strip says instead. It stays true for free.
 */

interface Source {
  name: string;
  feeds: string;
  detail: string;
}

const SOURCES: readonly Source[] = [
  {
    name: "Riot Match-V5",
    feeds: "Your games",
    detail:
      "Full match timelines, not the end-of-game scoreboard. Every ward, death and objective attempt with a timestamp on it — which is the only way a coach can tell you when a game was lost.",
  },
  {
    name: "Ranked meta snapshot",
    feeds: "Tier lists, builds, counters",
    detail:
      "Win, pick and ban rates from real ranked games on the live patch, rebuilt as the patch moves. The tier list, the counter picker and the build pages all read the same snapshot, so they cannot disagree with each other.",
  },
  {
    name: "Data Dragon",
    feeds: "Champions, items, runes",
    detail:
      "Riot's own asset and data feed, so ability text, item stats and the patch number are the game's, not a copy of them that goes stale.",
  },
  {
    name: "Riot esports feed",
    feeds: "Pro play",
    detail:
      "Schedules, live scores, standings and rosters from the published leagues, with pro pick and ban rates kept separate from solo queue — because they are not the same game.",
  },
];

export function ProvenanceStrip(): React.ReactElement {
  return (
    <section className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="Where the numbers come from" aside="No vibes" />
        <HudStagger className="grid grid-cols-1 gap-px border border-border bg-line-1 sm:grid-cols-2">
          {SOURCES.map((s) => (
            <HudStaggerItem key={s.name} className="h-full">
              <div className="flex h-full flex-col bg-background p-5 md:p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                  <p className="font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-text">
                    {s.name}
                  </p>
                  <span className="font-mono text-[10.5px] uppercase tracking-label text-accent">
                    {s.feeds}
                  </span>
                </div>
                <p className="mt-2.5 text-[13.5px] leading-relaxed text-text-muted">{s.detail}</p>
              </div>
            </HudStaggerItem>
          ))}
        </HudStagger>
        <p className="mt-4 font-mono text-[10px] uppercase tracking-wide text-fg-4">
          Ranked solo/duo unless stated · not endorsed by Riot Games
        </p>
      </div>
    </section>
  );
}
