import { itemIconUrl } from "@/lib/ddragon";
import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/uiLocale";
import type { LiveBuild } from "@/lib/liveContext";
import { isComplete, skillGrid, MAX_LEVEL, type Ability, type SkillRow } from "@/lib/skillGrid";

type Item = LiveBuild["core"][number];

/**
 * How a champion is built on the current patch: the skill order, then what to buy.
 *
 * Takes the build and nothing else, so the three places that show one can share it — the
 * live panel, the pregame read, and the champion browser. It is the same reading in all
 * three; only the reason for looking differs.
 *
 * Icons *and* names, now that both are here. The website resolves the ids to words, so the
 * words are what a player reads; the icon beside each one is what they actually recognise
 * mid-game, and the app's content policy has always admitted the host it comes from. An icon
 * that does not arrive leaves the outlined box it was drawn in, which still holds the item's
 * place in the order.
 */
export function BuildReading({ build }: { build: LiveBuild }): React.ReactElement {
  return (
    // `grid-cols-1` rather than the implicit column a bare `grid` makes. An implicit
    // column is `auto`, which sizes to the widest item's max-content — and the skill grid
    // is deliberately 620px wide, so the whole panel took that width instead of letting
    // the grid scroll inside it.
    <div className="grid min-w-0 grid-cols-1 gap-5 [&>*]:min-w-0">
      <Skills build={build} />
      <div className="grid grid-cols-1 gap-3.5 border-t border-line-1 pt-4">
        <Items label="Start" items={build.starters} />
        <Items label="Boots" items={build.boots} />
        <Items label="Core" items={build.core} ordered />
      </div>
    </div>
  );
}

/** The sample and its win rate — the number that says how much to trust the rest. */
export function BuildSample({ build }: { build: LiveBuild }): React.ReactElement | null {
  if (build.games <= 0) return null;

  return (
    <p className="min-w-0 truncate font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
      {build.winRate.toFixed(1)}% over {formatCount(build.games)} games
    </p>
  );
}

/**
 * One colour per ability, so a glance at the grid reads as four sequences rather than as
 * one pattern. R takes the warning amber because an ultimate is levelled three times and
 * those three columns are the ones a player is actually looking for.
 */
const TONES: Record<Ability, string> = {
  Q: "border-accent bg-accent text-ink-1000",
  W: "border-acid-600 bg-acid-600 text-ink-1000",
  E: "border-info bg-info text-ink-1000",
  R: "border-warning bg-warning text-ink-1000",
};

function Skills({ build }: { build: LiveBuild }): React.ReactElement | null {
  const rows = skillGrid(build.skillOrder);
  if (build.skillOrder.length === 0) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="hud-label text-[10px] tracking-[0.18em]">Skill order</p>
        {build.skillMaxOrder.length > 0 ? (
          <p className="font-mono text-[11px] tracking-[0.1em] text-text-muted">
            max {build.skillMaxOrder.join(" › ")}
          </p>
        ) : null}
      </div>

      {/* Scrolls rather than shrinking. Nineteen columns in a 340px pane makes each cell
          narrower than the digit inside it, and a grid whose numbers are unreadable is
          worse than one the player has to nudge sideways. */}
      {/* `min-w-0` as well as the scroll: an `overflow-x-auto` box still reports its
          content's width to its parent, so without it the 620px grid inside pushes the
          whole Build panel past the edge of the pane instead of scrolling within it. */}
      <div className="grid min-w-0 gap-1.5 overflow-x-auto">
        <div className="grid min-w-[460px] grid-cols-[24px_repeat(18,1fr)] gap-1">
          <span />
          {Array.from({ length: MAX_LEVEL }, (_, level) => (
            <span key={level} className="text-center font-mono text-[9px] text-text-faint">
              {level + 1}
            </span>
          ))}
        </div>
        {rows.map((row) => (
          <SkillRowView key={row.ability} row={row} />
        ))}
      </div>

      {!isComplete(build.skillOrder) ? (
        // Otherwise an order that stops at fifteen reads as a champion that stops levelling
        // at fifteen.
        <p className="mt-2.5 text-xs text-text-faint">
          The snapshot covers the first {build.skillOrder.length} levels.
        </p>
      ) : null}
    </div>
  );
}

function SkillRowView({ row }: { row: SkillRow }): React.ReactElement {
  return (
    <div className="grid min-w-[460px] grid-cols-[24px_repeat(18,1fr)] items-center gap-1">
      <span className="font-mono text-[11.5px] font-bold text-text-body">{row.ability}</span>
      {row.levels.map((on, level) => (
        <span
          key={level}
          title={`Level ${level + 1}`}
          className={cn(
            "grid h-5 place-items-center border font-mono text-[9px] font-bold",
            on ? TONES[row.ability] : "border-line-1 bg-surface-dark text-transparent"
          )}
        >
          {on ? level + 1 : ""}
        </span>
      ))}
    </div>
  );
}

function Items({
  label,
  items,
  ordered = false,
}: {
  label: string;
  items: Item[];
  ordered?: boolean;
}): React.ReactElement | null {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-[64px_minmax(0,1fr)] items-center gap-4">
      <p className="hud-label text-[10px] tracking-[0.18em]">{label}</p>
      <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {items.map((item, index) => (
          <li key={`${item.id}-${index}`} className="flex items-center gap-2">
            <span
              className={cn(
                "tag-cut block h-[30px] w-[30px] shrink-0 bg-surface-dark bg-cover",
                // The core is what the build is *for*, so those three carry the accent.
                ordered ? "border border-accent/40" : "border border-line-2"
              )}
              style={{ backgroundImage: `url(${itemIconUrl(item.id)})` }}
            />
            {/* An id the catalogue did not carry still takes its place in the order: a gap
                the player can see beats a build that is quietly one item shorter. */}
            <span className="text-[13.5px] text-text-body">
              {item.name || <span className="text-text-faint">item {item.id}</span>}
            </span>
            {/* After the item rather than before it, so a row that wraps does not start
                the next line with an arrow pointing at nothing. */}
            {ordered && index < items.length - 1 ? (
              <span aria-hidden className="ml-1 font-mono text-xs text-text-faint">
                ›
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
