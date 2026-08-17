"use client";

import { tierLetter } from "@/domains/meta/tierLetter";
import { movementOf } from "./tierDisplay";
import type { SortColumn, SortDirection } from "./sortEntries";
import type { TierListEntry } from "@/domains/meta";

/**
 * Groups sorted rows by tier letter, keeping the caller's order inside each group.
 *
 * Generic over the row so a caller that carries extra columns — the tier list's
 * pro presence — still has them on the far side of the grouping.
 */
export function groupByTier<T extends TierListEntry>(entries: T[]): { letter: string; rows: T[] }[] {
  const groups: { letter: string; rows: T[] }[] = [];
  for (const entry of entries) {
    const letter = tierLetter(entry.tier);
    const last = groups[groups.length - 1];
    if (last && last.letter === letter) last.rows.push(entry);
    else groups.push({ letter, rows: [entry] });
  }
  return groups;
}

const DIRECTION_WORD: Record<SortDirection, string> = {
  asc: "ascending",
  desc: "descending",
};

/**
 * A sortable column header. The table is a CSS grid rather than a `<table>`, so the sort state
 * rides on the button's accessible name — `aria-sort` has no valid host outside a real header cell.
 */
export function SortButton({
  label,
  column,
  sort,
  direction,
  onSort,
}: {
  label: string;
  column: SortColumn;
  sort: SortColumn;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
}): React.ReactElement {
  const active = sort === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      aria-label={active ? `${label}, sorted ${DIRECTION_WORD[direction]}` : `Sort by ${label}`}
      className={`text-right uppercase tracking-label transition-colors hover:text-text ${
        active ? "text-text" : ""
      }`}
    >
      {label}
      <span aria-hidden className="text-accent">
        {active ? (direction === "asc" ? " ▲" : " ▼") : ""}
      </span>
    </button>
  );
}

/** Places climbed since last patch, as an arrow. */
export function Movement({ entry }: { entry: TierListEntry }): React.ReactElement {
  const delta = movementOf(entry);
  if (delta === null || delta === 0) {
    return <span className="text-center font-mono text-xs text-text-faint">–</span>;
  }
  return (
    <span className={`text-center font-mono text-xs ${delta > 0 ? "text-accent" : "text-danger"}`}>
      {delta > 0 ? "▲" : "▼"}
      {Math.abs(delta)}
    </span>
  );
}
