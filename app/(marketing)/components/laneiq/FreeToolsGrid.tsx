import Image from "next/image";
import Link from "next/link";
import { DDRAGON_VERSION } from "@/lib/ddragon";
import { SectionHead } from "./SectionHead";

interface ToolTile {
  name: string;
  href: string;
  stat: string;
  /** File in /public/screenshots, without extension. */
  shot: string;
}

/**
 * The tiles show the tools themselves now, not champion art.
 *
 * Splash art made six identical decorative rectangles — pretty, and completely
 * silent about what any of these do. `scripts/captureScreenshots.ts` shoots the
 * real pages, deep-linked so each one is full of data rather than sitting on an
 * empty "select a champion" form. Re-run it when the design or the patch moves.
 */
const TOOLS: readonly ToolTile[] = [
  { name: "Counter picker", href: "/tools/counter-picker", stat: "Every lane matchup", shot: "counters" },
  { name: "Tier list", href: "/tools/tier-list", stat: "All roles, all tiers", shot: "tier-list" },
  { name: "Draft analyzer", href: "/tools/draft-analyzer", stat: "Both sides graded", shot: "draft-analyzer" },
  { name: "Champion builds", href: "/builds", stat: "Runes, items, skills", shot: "builds" },
  { name: "ARAM tier list", href: "/aram/tier-list", stat: "Howling Abyss only", shot: "aram" },
  { name: "Patch meta report", href: "/meta", stat: `Data Dragon ${DDRAGON_VERSION}`, shot: "meta" },
];

export function FreeToolsGrid(): React.ReactElement {
  return (
    <section id="tools" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead
          title="Free tools · no login"
          aside={
            <Link href="/tools" className="text-accent">
              All tools &rarr;
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {TOOLS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              // No box-shadow glow here: `notch` sets a clip-path, and clip-path
              // clips the shadow away. Emission comes from the art and the top edge.
              className="notch group relative block h-[180px] overflow-hidden border border-border transition-colors duration-[160ms] ease-out hover:border-accent motion-reduce:transition-none"
            >
              {/* The art carries the hover: it brightens and de-dims while the
                  protective gradient pulls back. Nothing scales — the system
                  forbids growth on hover (ADR-015). */}
              {/* Framed on the middle of each page, not the top of it. Anchored
                  at the top, all six tiles showed the same site header and the
                  grid read as six copies of one screenshot; at 42% each lands on
                  its own data — the counter bars, the tier rows, the rune page.
                  Dimmed at rest so the label stays the loudest thing on it. */}
              <Image
                src={`/screenshots/${t.shot}.jpg`}
                alt=""
                aria-hidden
                fill
                sizes="(max-width: 1024px) 50vw, 400px"
                className="object-cover object-[50%_42%] opacity-[0.6] brightness-[0.85] saturate-[0.95] transition-[opacity,filter] duration-[260ms] ease-out group-hover:opacity-100 group-hover:brightness-110 group-hover:saturate-100 motion-reduce:transition-none"
              />
              <div className="absolute inset-0 bg-[linear-gradient(0deg,var(--ink-1000)_12%,rgba(6,10,9,.28)_70%)] transition-opacity duration-[260ms] ease-out group-hover:opacity-70 motion-reduce:transition-none" />

              {/* 1px accent top edge — the system's signature for an interactive
                  card under the cursor. Fades rather than wipes so it reads as
                  emission, not a loading bar. */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-accent opacity-0 transition-opacity duration-[160ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
              />

              <div className="absolute inset-x-0 bottom-0 p-4">
                <p className="font-display text-base font-extrabold uppercase tracking-[0.05em] text-text">
                  {t.name}
                </p>
                <div className="mt-1.5 flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-accent">
                    {t.stat}
                  </span>
                  <span className="font-mono text-xs text-text-muted transition-colors duration-[160ms] ease-out group-hover:text-accent motion-reduce:transition-none">
                    &rarr;
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
