import Link from "next/link";
import { DDRAGON_VERSION } from "@/lib/ddragon";
// The count belongs to the hub, not to this section. Reading it across the route group is
// the only thing that keeps the promise in the header true when a tool is added or retired.
import { TOOL_COUNT } from "../../../(tools)/tools/toolIndex";
import { SectionHead } from "./SectionHead";
import { CounterMark, DraftRoomMark, TierMark } from "./screens/featuredMarks";
import { AramMark, BuildMark, DraftMark, MetaMark } from "./screens/supportingMarks";

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
 *
 * The grid is split rather than uniform. Six equal tiles made the ARAM tier list look exactly
 * as important as the counter picker, and a visitor who has to weigh seven identical boxes
 * usually clicks none of them. The three that answer the question people actually arrive with
 * — who beats this, what is strong, run my draft — take the top row at full width; the four
 * that are lookups sit under them, smaller.
 */
const FEATURED: readonly ToolTile[] = [
  {
    name: "Counter picker",
    href: "/tools/counter-picker",
    stat: "Every lane matchup",
    Mark: CounterMark,
  },
  { name: "Tier list", href: "/tools/tier-list", stat: "All roles, all tiers", Mark: TierMark },
  // The hub's own flagship, and until now the one tool this page never mentioned.
  { name: "Draft room", href: "/draft", stat: "Live pick/ban, fearless", Mark: DraftRoomMark },
];

const SUPPORTING: readonly ToolTile[] = [
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

function Tile({
  tool,
  featured,
  className,
}: {
  tool: ToolTile;
  featured: boolean;
  /** Grid placement. It belongs on the anchor, which is the grid item itself. */
  className?: string;
}): React.ReactElement {
  return (
    <Link
      href={tool.href}
      // No box-shadow glow here: `notch` sets a clip-path, and clip-path clips the shadow
      // away. Emission comes from the top edge.
      //
      // Heights only diverge at `lg`, where the row split exists. Below that every tile is
      // the same height, because a 248px tile beside a 196px one in a two-up row is not a
      // hierarchy, it is a ragged edge.
      className={`notch group relative flex h-[212px] flex-col overflow-hidden border border-border bg-surface transition-colors duration-[160ms] ease-out hover:border-accent motion-reduce:transition-none ${
        featured ? "lg:h-[248px]" : "lg:h-[200px]"
      } ${className ?? ""}`}
    >
      {/* The drawing sits on the instrument grid, dimmed at rest so the label below stays the
          loudest thing on the tile, and coming up under the cursor. Nothing scales — the
          system forbids growth on hover (ADR-015). */}
      <div
        className="flex flex-1 items-center px-4 opacity-80 transition-opacity duration-[260ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
        style={{ background: "var(--bg-grid)" }}
      >
        <div className="w-full">
          <tool.Mark />
        </div>
      </div>

      {/* 1px accent top edge — the system's signature for an interactive card under the
          cursor. Fades rather than wipes so it reads as emission, not a loading bar. */}
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-accent opacity-0 transition-opacity duration-[160ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
      />

      <div className="border-t border-border bg-surface p-4">
        <p
          className={`font-display font-extrabold uppercase tracking-[0.05em] text-text ${
            featured ? "text-base lg:text-lg" : "text-base"
          }`}
        >
          {tool.name}
        </p>
        <div className="mt-1.5 flex items-center justify-between gap-3">
          {/* Muted, not accent. Seven accent-green subtitles in one section spend the
              rationed accent (ADR-015) on the least important line in every tile; it is kept
              for the figure inside the drawing and for the cursor. */}
          <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-text-muted">
            {tool.stat}
          </span>
          <span className="font-mono text-xs text-text-muted transition-[color,transform] duration-[160ms] ease-out group-hover:translate-x-1 group-hover:text-accent motion-reduce:transition-none motion-reduce:group-hover:translate-x-0">
            &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}

export function FreeToolsGrid(): React.ReactElement {
  return (
    <section id="tools" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead
          title="Free tools · no login"
          note="Rebuilt every patch from real ranked games. No account, no install, no trial."
          aside={
            <Link href="/tools" className="text-accent">
              All {TOOL_COUNT} tools &rarr;
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-12">
          {FEATURED.map((t) => (
            <Tile key={t.href} tool={t} featured className="lg:col-span-4" />
          ))}
          {SUPPORTING.map((t, i) => (
            <Tile
              key={t.href}
              tool={t}
              featured={false}
              // Seven tiles two-up leaves the last one alone in its row; it takes the full
              // width there so the section closes on a line rather than on a gap.
              className={
                i === SUPPORTING.length - 1 ? "md:col-span-2 lg:col-span-3" : "lg:col-span-3"
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
