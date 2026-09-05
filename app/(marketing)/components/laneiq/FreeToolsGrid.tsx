import Link from "next/link";
import { DDRAGON_VERSION } from "@/lib/ddragon";
import { SectionHead } from "./SectionHead";
import {
  AramMark,
  BuildMark,
  CounterMark,
  DraftMark,
  MetaMark,
  TierMark,
} from "./screens/toolMarks";

interface ToolTile {
  name: string;
  href: string;
  stat: string;
  Mark: () => React.ReactElement;
}

/**
 * The tiles draw what each tool answers.
 *
 * They have been three things. Champion splash art, which made six identical decorative
 * rectangles that said nothing about what any of these do. Then real captures of the tool
 * pages, which said the right thing at the wrong size: a 1440px page inside a 400px tile is a
 * 3.5x reduction, and all six came out as grey rectangles with a green smudge. Now a drawing
 * small enough to be read at the size it is actually shown — ADR-050.
 *
 * The label moved out from on top of the art and onto a strip of its own underneath. Over a
 * photograph a gradient was enough to keep it legible; over a diagram it covered the diagram.
 */
const TOOLS: readonly ToolTile[] = [
  {
    name: "Counter picker",
    href: "/tools/counter-picker",
    stat: "Every lane matchup",
    Mark: CounterMark,
  },
  { name: "Tier list", href: "/tools/tier-list", stat: "All roles, all tiers", Mark: TierMark },
  {
    name: "Draft analyzer",
    href: "/tools/draft-analyzer",
    stat: "Both sides graded",
    Mark: DraftMark,
  },
  { name: "Champion builds", href: "/builds", stat: "Runes, items, skills", Mark: BuildMark },
  { name: "ARAM tier list", href: "/aram/tier-list", stat: "Howling Abyss only", Mark: AramMark },
  {
    name: "Patch meta report",
    href: "/meta",
    stat: `Data Dragon ${DDRAGON_VERSION}`,
    Mark: MetaMark,
  },
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
              // No box-shadow glow here: `notch` sets a clip-path, and clip-path clips the
              // shadow away. Emission comes from the top edge.
              className="notch group relative flex h-[180px] flex-col overflow-hidden border border-border bg-surface transition-colors duration-[160ms] ease-out hover:border-accent motion-reduce:transition-none"
            >
              {/* The drawing sits on the instrument grid, dimmed at rest so the label below
                  stays the loudest thing on the tile, and coming up under the cursor. Nothing
                  scales — the system forbids growth on hover (ADR-015). */}
              <div
                className="flex flex-1 items-center px-4 opacity-80 transition-opacity duration-[260ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
                style={{ background: "var(--bg-grid)" }}
              >
                <div className="w-full">
                  <t.Mark />
                </div>
              </div>

              {/* 1px accent top edge — the system's signature for an interactive card under
                  the cursor. Fades rather than wipes so it reads as emission, not a loading
                  bar. */}
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-px bg-accent opacity-0 transition-opacity duration-[160ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
              />

              <div className="border-t border-border bg-surface p-4">
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
