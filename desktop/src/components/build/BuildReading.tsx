import { cn } from "@/lib/cn";
import { formatCount } from "@/lib/uiLocale";
import type { LiveBuild } from "@/lib/liveContext";
import { isComplete, skillGrid, type SkillRow } from "@/lib/skillGrid";

type Item = LiveBuild["core"][number];

/**
 * How a champion is built on the current patch: the skill order, then what to buy.
 *
 * Takes the build and nothing else, so the two places that show one can share it — the live
 * panel, for the champion being played right now, and the champion browser, for one being
 * read about. It is the same reading either way; only the reason for looking differs.
 *
 * Names, not icons — and not for want of permission: `img-src` admits Data Dragon, and the
 * champion list draws a portrait from it on every row. The reason is what arrives. The
 * website resolves the item ids and sends words, so words are what this has to print; an
 * icon here would mean the desktop re-deriving ids the website already spent.
 */
export function BuildReading({ build }: { build: LiveBuild }): React.ReactElement {
  return (
    <div className="grid gap-4">
      <Skills build={build} />
      <div className="grid gap-3 border-t border-line-1 pt-4">
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
    <p className="truncate font-mono text-xs text-text-muted">
      {build.winRate.toFixed(1)}
      <span className="text-text-faint">% over {formatCount(build.games)} games</span>
    </p>
  );
}

function Skills({ build }: { build: LiveBuild }): React.ReactElement | null {
  const rows = skillGrid(build.skillOrder);
  if (build.skillOrder.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="hud-label">Skill order</p>
        {build.skillMaxOrder.length > 0 ? (
          <p className="font-mono text-xs text-text-muted">max {build.skillMaxOrder.join(" › ")}</p>
        ) : null}
      </div>
      <div className="grid gap-1">
        {rows.map((row) => (
          <SkillRowView key={row.ability} row={row} />
        ))}
      </div>
      {!isComplete(build.skillOrder) ? (
        // Otherwise an order that stops at fifteen reads as a champion that stops
        // levelling at fifteen.
        <p className="mt-2 text-xs text-text-faint">
          The snapshot covers the first {build.skillOrder.length} levels.
        </p>
      ) : null}
    </div>
  );
}

function SkillRowView({ row }: { row: SkillRow }): React.ReactElement {
  return (
    <div className="flex items-center gap-1">
      <span className="w-4 shrink-0 font-mono text-xs font-bold text-text-muted">{row.ability}</span>
      <div className="flex flex-1 gap-px">
        {row.levels.map((on, level) => (
          <span
            key={level}
            title={`Level ${level + 1}`}
            className={cn(
              "h-4 flex-1 border",
              on ? "border-accent bg-accent/25" : "border-line-1 bg-surface-dark"
            )}
          />
        ))}
      </div>
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
    <div className="flex items-baseline gap-3">
      <p className="hud-label w-12 shrink-0">{label}</p>
      <ol className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={`${item.id}-${index}`} className="text-sm text-text-body">
            {ordered && index > 0 ? <span className="mr-2 text-text-faint">›</span> : null}
            {/* An id the catalogue did not carry still takes its place in the order: a
                gap the player can see beats a build that is quietly one item shorter. */}
            {item.name || <span className="text-text-faint">item {item.id}</span>}
          </li>
        ))}
      </ol>
    </div>
  );
}
