import { memo, useMemo } from "react";
import { ChampionTile } from "@/components/hud/ChampionTile";
import { Spinner } from "@/components/hud/Spinner";
import { ChampionSplash } from "@/components/hud/Splash";
import { TierChip } from "@/components/champions/TierChip";
import { cn } from "@/lib/cn";
import { filterChampions, type DesktopChampionEntry } from "@/lib/champions";
import {
  groupByTier,
  sortChampions,
  winRateFill,
  winRateTone,
  type Sort,
} from "@/lib/championList";
import { formatCount } from "@/lib/uiLocale";
import type { ChampionListState } from "@/lib/useChampions";

const TONE_TEXT = { good: "text-accent", bad: "text-danger", even: "text-text" } as const;
const TONE_BAR = { good: "bg-accent", bad: "bg-danger", even: "bg-ink-400" } as const;

/**
 * One lane's champions, cut into tiers, as a list you pick from.
 *
 * The tier headers are the change that made this readable at a glance. The list is a
 * hundred and seventy rows of numbers that differ by tenths of a percent, and a letter every
 * few rows is what turns it back into a ranking — the same thing the website's tier list
 * does, which is where the grouping and its wording come from.
 *
 * Each row carries its champion's art, sunk almost to nothing behind the numbers. It is what
 * makes a lane scannable by shape rather than by reading every name, and it is why the row
 * is a hundred percent art and one percent opacity rather than a portrait beside a label.
 */
export function ChampionList({
  state,
  query,
  sort,
  selected,
  onSelect,
}: {
  state: ChampionListState;
  /** The name filter, from the screen. Empty means everything in the lane. */
  query: string;
  sort: Sort;
  selected: string | null;
  onSelect: (key: string) => void;
}): React.ReactElement {
  const entries = state.status === "ready" ? state.list.entries : [];

  // Before the early returns, not after. A hook behind a branch runs in a different order
  // on the render where the branch flips, which is the one rule hooks have.
  const groups = useMemo(
    () => groupByTier(sortChampions(filterChampions(entries, query), sort)),
    [entries, query, sort]
  );

  if (state.status !== "ready") return <ListNote state={state} />;

  if (state.list.entries.length === 0) {
    return <ListMessage>No champions are played in this lane on this patch.</ListMessage>;
  }
  if (groups.length === 0) {
    return <ListMessage>No champion in this lane is called “{query.trim()}”.</ListMessage>;
  }

  let row = 0;

  return (
    <div>
      {groups.map((group, index) => (
        <section key={`${group.letter}-${index}`}>
          {/* Sticky, and over glass rather than a fill: the row scrolling under it stays
              half-visible, so the header reads as a marker in the list and not as a lid. */}
          <header className="sticky top-0 z-10 flex items-center gap-3 border-y border-line-1 bg-surface/80 px-4 py-2 backdrop-blur-[14px]">
            <TierChip tier={group.letter} />
            <span className="hud-label text-[9.5px]">{group.note}</span>
            <span className="ml-auto font-mono text-[9.5px] tracking-[0.14em] text-text-faint">
              {group.entries.length}
            </span>
          </header>
          {group.entries.map((entry) => (
            <Row
              key={entry.championKey}
              entry={entry}
              active={entry.championKey === selected}
              index={row++}
              onSelect={onSelect}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

/**
 * One champion.
 *
 * Memoised because a lane is a hundred and seventy of these and the two things that change
 * around them — a keystroke in the search box, a click on another row — change nothing about
 * any row but one. `onSelect` is a `useState` setter handed straight out of `useChampions`,
 * so its identity never changes and the memo really does hold.
 */
const Row = memo(function Row({
  entry,
  active,
  index,
  onSelect,
}: {
  entry: DesktopChampionEntry;
  active: boolean;
  index: number;
  onSelect: (key: string) => void;
}): React.ReactElement {
  const tone = winRateTone(entry.winRate);

  return (
    <button
      type="button"
      onClick={() => onSelect(entry.championKey)}
      aria-current={active ? "true" : undefined}
      style={{ animationDelay: `${Math.min(index, 24) * 22}ms` }}
      className={cn(
        "hud-row-in relative block w-full overflow-hidden border-b border-l-2 border-b-line-1 px-4 py-2.5 text-left",
        "transition-colors duration-150 ease-out",
        active ? "border-l-accent bg-accent/10" : "border-l-transparent hover:bg-white/5"
      )}
    >
      <ChampionSplash
        champion={entry.championKey}
        opacity={active ? 0.3 : 0.14}
        position="56% 16%"
        className="brightness-[.7]"
      />

      <span className="relative grid w-full grid-cols-[36px_minmax(0,1fr)_max-content] items-center gap-3">
        <ChampionTile champion={entry.championKey} size={36} selected={active} />

        <span className="min-w-0">
          <span className={cn("block truncate text-sm", active ? "text-accent" : "text-text")}>
            {entry.name}
          </span>
          <span className="mt-1 block font-mono text-[9.5px] tracking-[0.1em] text-text-faint">
            #{entry.rank || "—"} P {entry.pickRate.toFixed(1)}% B {entry.banRate.toFixed(1)}%
          </span>
          <span aria-hidden className="mt-1.5 block h-[3px] bg-surface-dark">
            <span
              className={cn("hud-bar block h-full", TONE_BAR[tone])}
              style={{ width: `${winRateFill(entry.winRate)}%` }}
            />
          </span>
        </span>

        <span className="text-right">
          <span className={cn("block font-mono text-sm font-bold tabular-nums", TONE_TEXT[tone])}>
            {entry.winRate.toFixed(1)}%
          </span>
          {/* The sample travels with the tier it qualifies. A grade off thirty games is
              noise, and the player comparing two rows has to be able to see which. */}
          <span
            title={`${formatCount(entry.games)} games`}
            className={cn(
              "mt-1 block font-mono text-[9.5px] tabular-nums tracking-[0.1em]",
              entry.lowConfidence ? "text-warning" : "text-text-faint"
            )}
          >
            {compact(entry.games)}
            {entry.lowConfidence ? " low" : ""}
          </span>
        </span>
      </span>
    </button>
  );
});

/** Four digits of games in a column this narrow is the sample, not the number. */
function compact(count: number): string {
  return count >= 1000 ? `${Math.round(count / 1000)}K` : String(count);
}

function ListMessage({ children }: { children: React.ReactNode }): React.ReactElement {
  return <p className="px-4 py-8 text-center text-[13.5px] text-text-muted">{children}</p>;
}

/** The list's four ways of having nothing to show, each with what the player can do. */
function ListNote({
  state,
}: {
  state: Exclude<ChampionListState, { status: "ready" }>;
}): React.ReactElement {
  if (state.status === "loading") {
    return (
      <div className="p-4">
        {/* Rows in outline, so the wait is the shape of what is coming rather than a void. */}
        <div className="grid gap-2">
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className="hud-shimmer block h-[58px] border border-line-1 bg-surface-dark"
              style={{ animationDelay: `${i * 90}ms` }}
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-3 py-6">
          <Spinner size={18} />
          <span className="text-[13.5px] text-text-muted">Reading this patch…</span>
        </div>
      </div>
    );
  }

  return (
    <ListMessage>
      {state.status === "unavailable"
        ? "This preview cannot reach the website. Run the desktop app, which has the credential store."
        : state.status === "unpaired"
          ? "Pair this machine on the Pairing screen."
          : state.message}
    </ListMessage>
  );
}
