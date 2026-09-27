"use client";

import { SortButton } from "./TierTableParts";
import type { SortColumn, SortDirection } from "./sortEntries";

interface TierTableHeaderProps {
  gridTemplateColumns: string;
  sort: SortColumn;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
  showBan: boolean;
  showMovement: boolean;
  showWeak: boolean;
  showPro: boolean;
}

/** The ranking table's sortable column header; its columns must match the rows' grid. */
export function TierTableHeader({
  gridTemplateColumns,
  sort,
  direction,
  onSort,
  showBan,
  showMovement,
  showWeak,
  showPro,
}: TierTableHeaderProps): React.ReactElement {
  return (
    <div
      className="grid items-center gap-3.5 border-b border-line-2 bg-surface-2 px-5 py-3 font-mono text-[10.5px] uppercase tracking-label text-text-muted"
      style={{ gridTemplateColumns }}
    >
      <span>#</span>
      <SortButton label="Tier" column="tier" sort={sort} direction={direction} onSort={onSort} />
      {/* Champion is not sortable — the name column identifies a row, it doesn't rank it. */}
      <span>Champion</span>
      {showMovement && (
        <span className="text-center">
          <SortButton
            label="Δ Patch"
            column="movement"
            sort={sort}
            direction={direction}
            onSort={onSort}
          />
        </span>
      )}
      <SortButton label="Win" column="winRate" sort={sort} direction={direction} onSort={onSort} />
      <SortButton
        label="Pick"
        column="pickRate"
        sort={sort}
        direction={direction}
        onSort={onSort}
      />
      {showBan && (
        <SortButton
          label="Ban"
          column="banRate"
          sort={sort}
          direction={direction}
          onSort={onSort}
        />
      )}
      {showWeak && (
        <span title="The lane opponents with the best win rate against this champion">Weak vs</span>
      )}
      {showPro && (
        <span title="Share of recent professional games this champion was picked in">
          <SortButton label="Pro" column="pro" sort={sort} direction={direction} onSort={onSort} />
        </span>
      )}
    </div>
  );
}
