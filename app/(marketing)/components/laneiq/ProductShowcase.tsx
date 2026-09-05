import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { HudReveal } from "./motion";
import { DashboardScreen } from "./screens/DashboardScreen";
import { TierListScreen } from "./screens/TierListScreen";
import { EsportsScreen } from "./screens/EsportsScreen";
import { DailyScreen } from "./screens/DailyScreen";

/**
 * The product, drawn.
 *
 * This section used to photograph it: `scripts/captureScreenshots.ts` shot the running app and
 * the four JPEGs went here. Three things were wrong with that, and ADR-050 records the
 * decision to stop.
 *
 * The lead capture was a 1440px page shown at 1240px, and it included the app's own top bar —
 * so a wordmark and a player-search field landed immediately under the marketing header's
 * wordmark and player-search field, and the picture read as the page having embedded itself.
 * The three supporting captures were the same 1440px pages at 400px, which is a 3.5× reduction
 * and left three unreadable grey rectangles. And the tier list carried its patch number in the
 * pixels, so it was a false claim within a fortnight of every capture.
 *
 * Drawings have none of those problems and one of their own: they do not update themselves
 * when the real screens change. That is the trade ADR-050 accepts, and it is why every drawing
 * cites the file it was read off.
 */

interface Shot {
  title: string;
  caption: string;
  href: string;
  Screen: () => React.ReactElement;
}

const LEAD: Shot = {
  title: "Your dashboard",
  caption:
    "Readiness before you queue, the habit to work on, last game graded, and the trend across your recent games — on one screen.",
  href: "/register",
  Screen: DashboardScreen,
};

const SUPPORTING: readonly Shot[] = [
  {
    title: "Tier list",
    caption: "Every lane, every rank band, rebuilt each patch.",
    href: "/tools/tier-list",
    Screen: TierListScreen,
  },
  {
    title: "Esports",
    caption: "Live scores and the pro meta, free.",
    href: "/esports",
    Screen: EsportsScreen,
  },
  {
    title: "LaneIQ Daily",
    caption: "Eight champion puzzles, new every day.",
    href: "/quiz",
    Screen: DailyScreen,
  },
];

function Card({ title, caption, href, Screen }: Shot): React.ReactElement {
  return (
    <Link
      href={href}
      className="notch group flex h-full flex-col border border-border bg-surface transition-colors duration-[160ms] ease-out hover:border-accent motion-reduce:transition-none"
    >
      {/* The drawing sits on the instrument grid rather than on the card's own fill, so the
          screen it draws has a ground to be *on*. Without it the panel edges and the card edge
          are the same colour a pixel apart and the whole thing reads as one flat diagram.

          Centred, because the three supporting cards are a grid row and a grid row is as tall
          as its tallest member. Anchored at the top instead, the two shorter drawings each sat
          above a slab of empty grid and the row read as two things that had failed to load. */}
      <div
        className="relative flex flex-1 items-center p-3 md:p-4"
        style={{ background: "var(--bg-grid)" }}
      >
        <div className="w-full">
          <Screen />
        </div>
      </div>

      <span
        aria-hidden
        className="h-px w-full bg-accent opacity-0 transition-opacity duration-[160ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
      />

      <div className="border-t border-border p-4 md:p-5">
        <p className="font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-text">
          {title}
        </p>
        <p className="mt-1.5 max-w-[52ch] text-[13px] leading-relaxed text-text-muted">{caption}</p>
      </div>
    </Link>
  );
}

export function ProductShowcase(): React.ReactElement {
  return (
    <section id="inside" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        {/* It said "Real screens, not mock-ups" while the captures were here. They are drawings
            now, and a page that keeps the old boast would be lying in its own subtitle. */}
        <SectionHead title="Inside the app" aside="Drawn from the real screens" />

        <HudReveal>
          <Card {...LEAD} />
        </HudReveal>

        <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {SUPPORTING.map((s, i) => (
            <HudReveal key={s.href} index={i}>
              <div className="h-full">
                <Card {...s} />
              </div>
            </HudReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
