import { HudPanel } from "@/components/layout/HudPanel";
import { noteFor, PanelNote } from "@/components/game/PanelNote";
import { cn } from "@/lib/cn";
import type { LiveContext } from "@/lib/liveContext";
import { isComplete, skillGrid, type SkillRow } from "@/lib/skillGrid";
import type { LiveContextState } from "@/lib/useLiveContext";

type Build = NonNullable<LiveContext["build"]>;
type Item = Build["core"][number];

/**
 * How this champion is built on the current patch.
 *
 * Static advice about a champion rather than a reading of the running game, which is what
 * keeps it clear of Riot's ban on notifications that dictate play from the game state:
 * this is the same thing the website would have told the player before they queued, put
 * where they can still act on it.
 *
 * Names, not icons. The app's content policy allows images from itself and `data:` alone,
 * so a Data Dragon URL would render as a broken frame — the website resolves the ids and
 * sends words.
 */
export function BuildPanel({ state }: { state: LiveContextState }): React.ReactElement {
  const note = noteFor(state);
  const context = state.status === "ready" ? state.context : null;
  const build = context?.build ?? null;

  return (
    <HudPanel title="Build" action={build ? <Sample build={build} /> : null}>
      {note ?? (context ? build ? <Reading build={build} /> : <NoBuild /> : null)}
    </HudPanel>
  );
}

/** The sample and its win rate, in the header — the number that says how much to trust the rest. */
function Sample({ build }: { build: Build }): React.ReactElement | null {
  if (build.games <= 0) return null;

  return (
    <p className="truncate font-mono text-xs text-text-muted">
      {build.winRate.toFixed(1)}
      <span className="text-text-faint">% over {build.games.toLocaleString()} games</span>
    </p>
  );
}

function NoBuild(): React.ReactElement {
  // Two different reasons, and the player can act on neither, so they get one honest line
  // rather than a guess about which applies.
  return <PanelNote>No build for this champion and lane on the current patch.</PanelNote>;
}

function Reading({ build }: { build: Build }): React.ReactElement {
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

function Skills({ build }: { build: Build }): React.ReactElement | null {
  const rows = skillGrid(build.skillOrder);
  if (build.skillOrder.length === 0) return null;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <p className="hud-label">Skill order</p>
        {build.skillMaxOrder.length > 0 ? (
          <p className="font-mono text-xs text-text-muted">
            max {build.skillMaxOrder.join(" › ")}
          </p>
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
      <span className="w-4 shrink-0 font-mono text-xs font-bold text-text-muted">
        {row.ability}
      </span>
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
