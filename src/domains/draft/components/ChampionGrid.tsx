"use client";

import { useMemo, useRef, useState } from "react";
import { ALL_POSITIONS, POSITION_LABELS } from "@/domains/meta/positions";
import type { CanonicalPosition } from "@/domains/meta/types";
import type { LegalityReason } from "@/domains/draft";
import type { DraftChampion } from "@/domains/draft/draftCatalog.types";
import { ChampionCell } from "./ChampionCell";
import { filterChampions } from "./championSearch";

interface Props {
  champions: readonly DraftChampion[];
  reasonFor: (key: string) => LegalityReason | null;
  selected: string | null;
  onSelect: (key: string) => void;
  onCommit: () => void;
  interactive: boolean;
}

/** The exact column count, read from the DOM rather than guessed from a
 *  breakpoint — the first cell that wraps onto a new row gives it away. */
function columnCount(container: HTMLElement | null): number {
  const cells = Array.from(container?.children ?? []) as HTMLElement[];
  if (cells.length === 0) return 1;
  const top = cells[0].offsetTop;
  const wrapped = cells.findIndex((cell) => cell.offsetTop > top);
  return wrapped === -1 ? cells.length : wrapped;
}

type SortKey = "name" | "winRate" | "presence";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "name", label: "A–Z" },
  { key: "winRate", label: "Win rate" },
  { key: "presence", label: "Presence" },
];

/** How much of the patch a champion is on: picked plus banned. */
function presence(champion: DraftChampion): number {
  return champion.pickRate + champion.banRate;
}

export function ChampionGrid({
  champions,
  reasonFor,
  selected,
  onSelect,
  onCommit,
  interactive,
}: Props): React.ReactElement {
  const [query, setQuery] = useState("");
  const [lane, setLane] = useState<CanonicalPosition | null>(null);
  const [sort, setSort] = useState<SortKey>("name");
  const gridRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const visible = useMemo(() => {
    const matched = filterChampions(champions, { query, lane });
    if (sort === "name") return matched;
    // Copied before sorting: `filterChampions` may hand back the catalog array
    // itself when nothing is filtered out, and sorting that in place would
    // reorder every other consumer's view of the pool.
    const ranked = [...matched];
    ranked.sort((a, b) =>
      sort === "winRate" ? b.winRate - a.winRate : presence(b) - presence(a)
    );
    return ranked;
  }, [champions, query, lane, sort]);

  function moveSelection(delta: number): void {
    if (visible.length === 0) return;
    const current = visible.findIndex((c) => c.key === selected);
    const next = Math.max(0, Math.min(visible.length - 1, (current === -1 ? 0 : current) + delta));
    const champion = visible[next];
    if (champion && !reasonFor(champion.key)) onSelect(champion.key);
  }

  function onKeyDown(event: React.KeyboardEvent): void {
    if (event.key === "/") {
      event.preventDefault();
      searchRef.current?.focus();
      return;
    }
    if (!interactive) return;

    const columns = columnCount(gridRef.current);
    const step: Record<string, number> = {
      ArrowRight: 1,
      ArrowLeft: -1,
      ArrowDown: columns,
      ArrowUp: -columns,
    };
    if (event.key in step) {
      event.preventDefault();
      moveSelection(step[event.key]!);
      return;
    }
    if (event.key === "Enter" && selected) {
      event.preventDefault();
      onCommit();
    }
  }

  return (
    <div onKeyDown={onKeyDown} className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <LaneChip active={lane === null} onClick={() => setLane(null)} label="All" />
          {ALL_POSITIONS.map((position) => (
            <LaneChip
              key={position}
              active={lane === position}
              onClick={() => setLane(lane === position ? null : position)}
              label={POSITION_LABELS[position]}
            />
          ))}
        </div>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-[9.5px] uppercase tracking-label text-text-muted">
            Sort
          </span>
          {SORTS.map((option) => (
            <LaneChip
              key={option.key}
              active={sort === option.key}
              onClick={() => setSort(option.key)}
              label={option.label}
            />
          ))}
        </span>
        <input
          ref={searchRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search — try mf, asol, j4"
          aria-label="Search champions"
          className="notch-sm min-w-[180px] flex-1 border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
        />
      </div>

      <div
        ref={gridRef}
        role="listbox"
        aria-label="Champions"
        tabIndex={0}
        className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(58px,1fr))] gap-0.5 overflow-y-auto focus:outline-none"
      >
        {visible.map((champion) => (
          <ChampionCell
            key={champion.key}
            champion={champion}
            reason={reasonFor(champion.key)}
            selected={selected === champion.key}
            highlighted={false}
            onSelect={() => interactive && onSelect(champion.key)}
          />
        ))}
      </div>

      {visible.length === 0 && (
        <p className="py-6 text-center text-[13px] text-text-muted">
          No champion matches that filter.
        </p>
      )}
    </div>
  );
}

function LaneChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}): React.ReactElement {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`notch-sm border px-2.5 py-1.5 text-[11.5px] font-semibold uppercase tracking-label transition-colors ${
        active
          ? "border-accent bg-accent/10 text-accent"
          : "border-border bg-surface-2 text-text-muted hover:text-text-body"
      }`}
    >
      {label}
    </button>
  );
}
