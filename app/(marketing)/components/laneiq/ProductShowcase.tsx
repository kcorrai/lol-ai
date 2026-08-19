import Image from "next/image";
import Link from "next/link";
import { SectionHead } from "./SectionHead";
import { HudReveal } from "./motion";

/**
 * The product, photographed.
 *
 * Everything else on this page either draws the product (the Arsenal panels,
 * the sample report) or shows champion art next to a claim about it. Neither is
 * the thing itself, and a visitor deciding whether to sign up is entitled to see
 * the actual screens before they do.
 *
 * The files come from `scripts/captureScreenshots.ts`, which shoots the running
 * app rather than being retouched by hand — they go stale on every patch and
 * every redesign, so re-running it has to be cheaper than editing a PNG.
 */

interface Shot {
  shot: string;
  title: string;
  caption: string;
  href: string;
  /** Frame aspect. The captures are 1440×900. */
  wide?: boolean;
}

const LEAD: Shot = {
  shot: "dashboard",
  title: "Your dashboard",
  caption:
    "Readiness before you queue, the habit to work on, last game graded, and the trend across your recent games — on one screen.",
  href: "/register",
  wide: true,
};

const SUPPORTING: readonly Shot[] = [
  {
    shot: "tier-list",
    title: "Tier list",
    caption: "Every lane, every rank band, rebuilt each patch.",
    href: "/tools/tier-list",
  },
  {
    shot: "esports",
    title: "Esports",
    caption: "Live scores and the pro meta, free.",
    href: "/esports",
  },
  {
    shot: "quiz",
    title: "LaneIQ Daily",
    caption: "Eight champion puzzles, new every day.",
    href: "/quiz",
  },
];

function Frame({ shot, title, caption, href, wide }: Shot): React.ReactElement {
  return (
    <Link
      href={href}
      className="notch group relative block overflow-hidden border border-border bg-surface transition-colors duration-[160ms] ease-out hover:border-accent motion-reduce:transition-none"
    >
      <div className={`relative w-full overflow-hidden ${wide ? "aspect-[16/9]" : "aspect-[16/10]"}`}>
        <Image
          src={`/screenshots/${shot}.jpg`}
          alt={`${title} — a screenshot of LoL AI Coach`}
          fill
          sizes={wide ? "(max-width: 1024px) 100vw, 1200px" : "(max-width: 1024px) 100vw, 400px"}
          className="object-cover object-top transition-[filter] duration-[260ms] ease-out group-hover:brightness-105 motion-reduce:transition-none"
        />
        {/* The captures run to the bottom of a 900px viewport, so the last row is
            always a half-cut card. Fading the bottom edge into the panel makes
            that read as a frame rather than a mistake. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-[linear-gradient(0deg,var(--surface-panel),transparent)]"
        />
      </div>

      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-accent opacity-0 transition-opacity duration-[160ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
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
        <SectionHead title="Inside the app" aside="Real screens, not mock-ups" />

        <HudReveal>
          <Frame {...LEAD} />
        </HudReveal>

        <div className="mt-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
          {SUPPORTING.map((s, i) => (
            <HudReveal key={s.shot} index={i}>
              <Frame {...s} />
            </HudReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
