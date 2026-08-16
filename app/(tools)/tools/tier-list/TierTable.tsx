"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { TIER_NOTE, formatGames, tierChipClass, winRateScale } from "./tierDisplay";
import { Movement, SortButton, groupByTier } from "./TierTableParts";
import type { SortColumn, SortDirection } from "./sortEntries";
import type { TierListEntry } from "@/domains/meta";

interface TierTableProps {
  entries: TierListEntry[]; // already sorted by the caller
  sort: SortColumn;
  direction: SortDirection;
  onSort: (column: SortColumn) => void;
  hrefBase: string;
  showBan: boolean;
  showMovement: boolean;
}

const CELL = "font-mono text-[13px] tabular-nums";

/** The ranking table: a sortable header, then one block per tier. */
export function TierTable({
  entries,
  sort,
  direction,
  onSort,
  hrefBase,
  showBan,
  showMovement,
}: TierTableProps): React.ReactElement {
  const scale = winRateScale(entries);
  const groups = groupByTier(entries);
  const gridTemplateColumns = [
    "44px",
    "34px",
    "minmax(150px,1fr)",
    showMovement ? "78px" : null,
    "132px",
    "82px",
    showBan ? "82px" : null,
  ]
    .filter(Boolean)
    .join(" ");

  let ordinal = 0;

  return (
    <section className="notch overflow-x-auto border border-border bg-surface">
      <div className="min-w-[720px]">
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
          <SortButton label="Pick" column="pickRate" sort={sort} direction={direction} onSort={onSort} />
          {showBan && (
            <SortButton label="Ban" column="banRate" sort={sort} direction={direction} onSort={onSort} />
          )}
        </div>

        {groups.map((group) => (
          <div key={`${group.letter}-${group.rows[0].championKey}`}>
            <div className="flex items-center gap-3 border-b border-line-1 bg-surface-dark px-5 py-2.5">
              <span
                className={`tag-cut inline-grid h-[26px] w-[26px] place-items-center border font-mono text-[13px] font-bold ${tierChipClass(group.letter)}`}
              >
                {group.letter}
              </span>
              <span className="hud-label text-[10.5px]">{TIER_NOTE[group.letter] ?? ""}</span>
              <span className="ml-auto font-mono text-[10.5px] tracking-[0.14em] text-text-faint">
                {group.rows.length} champion{group.rows.length === 1 ? "" : "s"}
              </span>
            </div>

            {group.rows.map((entry) => {
              ordinal += 1;
              const strong = entry.winRate >= 52;
              const weak = entry.winRate < 50;
              return (
                <div
                  key={entry.championKey}
                  className={`grid items-center gap-3.5 border-b border-line-1 px-5 py-2.5 transition-colors hover:bg-surface-2/60 ${
                    strong ? "border-l-2 border-l-accent" : weak ? "border-l-2 border-l-danger/45" : "border-l-2 border-l-transparent"
                  }`}
                  style={{ gridTemplateColumns }}
                >
                  <span className={`${CELL} text-text-faint`}>{ordinal}</span>
                  <span
                    title={entry.lowConfidence ? `Low sample — ${formatGames(entry.games)} games` : undefined}
                    className={`tag-cut inline-grid h-[22px] w-[22px] place-items-center border font-mono text-[11.5px] font-bold ${tierChipClass(group.letter, entry.lowConfidence)}`}
                  >
                    {group.letter}
                  </span>
                  <Link
                    href={`${hrefBase}/${entry.championKey}`}
                    className="flex min-w-0 items-center gap-3 hover:text-accent"
                  >
                    <ChampionIcon name={entry.championKey} size={34} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm text-text">{entry.name}</span>
                      <span
                        className={`block font-mono text-[10.5px] tracking-[0.1em] ${entry.lowConfidence ? "text-warning/70" : "text-text-faint"}`}
                      >
                        {formatGames(entry.games)} games{entry.lowConfidence ? " · low confidence" : ""}
                      </span>
                    </span>
                  </Link>
                  {showMovement && <Movement entry={entry} />}
                  <span className="flex items-center justify-end gap-2.5">
                    <span className="h-1 w-[54px] bg-surface-dark">
                      <span
                        className={`block h-1 ${strong ? "bg-accent" : weak ? "bg-danger" : "bg-ink-400"}`}
                        style={{ width: `${scale(entry.winRate)}%` }}
                      />
                    </span>
                    <span
                      className={`w-[52px] text-right font-mono text-[13.5px] font-bold tabular-nums ${
                        strong ? "text-accent" : weak ? "text-danger" : "text-text"
                      }`}
                    >
                      {entry.winRate.toFixed(1)}%
                    </span>
                  </span>
                  <span className={`${CELL} text-right text-text-body`}>{entry.pickRate.toFixed(1)}%</span>
                  {showBan && (
                    <span className={`${CELL} text-right text-text-muted`}>{entry.banRate.toFixed(1)}%</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </section>
  );
}
