"use client";

import { useMemo, useState } from "react";
import type { TierListEntry } from "@/domains/meta";
import { TierRow } from "./TierRow";
import {
  sortEntries,
  defaultDirectionFor,
  DEFAULT_SORT,
  type SortColumn,
  type SortDirection,
} from "./sortEntries";

interface Props {
  entries: TierListEntry[];
  hrefBase?: string;
  showBan?: boolean;
  showMovement?: boolean;
  minWidthClass?: string;
}

interface ColumnDef {
  key: SortColumn;
  label: string;
  align: "left" | "center" | "right";
  className: string;
}

const BASE_COLUMNS: ColumnDef[] = [
  { key: "tier", label: "Tier", align: "left", className: "px-2" },
];

export function SortableTierTable({
  entries,
  hrefBase,
  showBan = true,
  showMovement = false,
  minWidthClass = "min-w-[560px]",
}: Props) {
  const [column, setColumn] = useState<SortColumn>(DEFAULT_SORT.column);
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_SORT.direction);

  const sorted = useMemo(() => sortEntries(entries, column, direction), [entries, column, direction]);

  // A repeat click on the active column reverses it; a new column opens on whichever
  // direction reads best-first for that metric.
  function toggle(next: SortColumn) {
    if (next === column) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setColumn(next);
    setDirection(defaultDirectionFor(next));
  }

  // Everything after the Champion column, which is static and sits third to match TierRow.
  const trailingColumns: ColumnDef[] = [
    ...(showMovement
      ? [{ key: "movement" as const, label: "Patch", align: "center" as const, className: "px-2" }]
      : []),
    { key: "winRate", label: "Win", align: "right", className: "px-2" },
    {
      key: "pickRate",
      label: "Pick",
      align: "right",
      className: showBan ? "px-2" : "py-2 pl-2 pr-3",
    },
    ...(showBan
      ? [{ key: "banRate" as const, label: "Ban", align: "right" as const, className: "py-2 pl-2 pr-3" }]
      : []),
  ];

  return (
    <div className={`overflow-x-auto rounded-2xl border border-border bg-surface/60`}>
      <table className={`w-full ${minWidthClass}`}>
        <thead>
          <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-text-muted">
            <th className="py-2 pl-3 pr-2 font-semibold">#</th>
            {BASE_COLUMNS.map((col) => (
              <SortableHeader
                key={col.key}
                col={col}
                active={col.key === column}
                direction={direction}
                onClick={() => toggle(col.key)}
              />
            ))}
            {/* Champion is not sortable — the name column identifies a row, it doesn't rank it. */}
            <th className="px-2 font-semibold">Champion</th>
            {trailingColumns.map((col) => (
              <SortableHeader
                key={col.key}
                col={col}
                active={col.key === column}
                direction={direction}
                onClick={() => toggle(col.key)}
              />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry, i) => (
            <TierRow
              key={entry.championKey}
              entry={entry}
              index={i}
              hrefBase={hrefBase}
              showBan={showBan}
              showMovement={showMovement}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortableHeader({
  col,
  active,
  direction,
  onClick,
}: {
  col: ColumnDef;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  const alignClass =
    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left";

  return (
    <th
      className={`${col.className} ${alignClass} font-semibold`}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 uppercase tracking-wide transition-colors hover:text-text ${
          active ? "text-accent" : ""
        }`}
      >
        {col.label}
        <span aria-hidden className={active ? "" : "opacity-0 group-hover:opacity-40"}>
          {active ? (direction === "asc" ? "▲" : "▼") : "▲"}
        </span>
      </button>
    </th>
  );
}
