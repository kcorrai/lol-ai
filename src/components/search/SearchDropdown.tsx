"use client";

import Image from "next/image";
import { Star, ArrowUpRight } from "lucide-react";
import { profileIconUrl } from "@/lib/ddragon";
import { regionLabel } from "@/lib/riot/regions";
import { playerKey } from "@/lib/stores/searchStore";
import { SECTION_LABELS, type SearchRow } from "@/components/search/searchTypes";

interface Props {
  rows: readonly SearchRow[];
  /** Index into `rows` of the keyboard-highlighted row, or -1. */
  activeIndex: number;
  isLoading: boolean;
  /** True once a query has been typed, which changes what "no rows" means. */
  hasQuery: boolean;
  favoriteKeys: ReadonlySet<string>;
  listId: string;
  onSelect: (row: SearchRow) => void;
  onHover: (index: number) => void;
  onToggleFavorite: (row: SearchRow) => void;
}

/** Rows carry their section, so the visual grouping is derived rather than tracked separately. */
function groupRows(rows: readonly SearchRow[]): Array<{ start: number; rows: SearchRow[] }> {
  const groups: Array<{ start: number; rows: SearchRow[] }> = [];

  rows.forEach((row, index) => {
    const last = groups[groups.length - 1];
    if (last && last.rows[0]?.section === row.section) last.rows.push(row);
    else groups.push({ start: index, rows: [row] });
  });

  return groups;
}

export function SearchDropdown({
  rows,
  activeIndex,
  isLoading,
  hasQuery,
  favoriteKeys,
  listId,
  onSelect,
  onHover,
  onToggleFavorite,
}: Props): React.ReactElement {
  return (
    <div className="notch absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-[380px] overflow-y-auto border border-border bg-surface shadow-[0_12px_32px_rgba(0,0,0,0.55)]">
      {rows.length === 0 ? (
        <p className="px-4 py-5 text-center font-mono text-[11px] uppercase tracking-label text-text-muted">
          {isLoading ? "Searching…" : hasQuery ? "No players found" : "Type a Riot ID"}
        </p>
      ) : (
        <ul id={listId} role="listbox" aria-label="Player search results">
          {groupRows(rows).map((group) => (
            <li key={`${group.rows[0]?.section}-${group.start}`}>
              <p className="hud-label border-b border-border/60 bg-surface-dark px-3 py-1.5">
                {SECTION_LABELS[group.rows[0]!.section]}
              </p>
              <ul>
                {group.rows.map((row, offset) => {
                  const index = group.start + offset;
                  const active = index === activeIndex;
                  const key = playerKey(row.hit);
                  const isFavorite = favoriteKeys.has(key);
                  const isDirect = row.section === "direct";

                  return (
                    <li key={`${row.section}-${key}`}>
                      <div
                        id={`${listId}-opt-${index}`}
                        role="option"
                        aria-selected={active}
                        tabIndex={-1}
                        onMouseEnter={() => onHover(index)}
                        // Mouse down rather than click: the input's blur handler closes the panel,
                        // and blur fires first, so a click listener never runs.
                        onMouseDown={(e) => {
                          e.preventDefault();
                          onSelect(row);
                        }}
                        className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${
                          active ? "bg-surface-hover" : ""
                        }`}
                      >
                        {isDirect ? (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center border border-border bg-surface-dark">
                            <ArrowUpRight className="h-3.5 w-3.5 text-accent" strokeWidth={2} />
                          </span>
                        ) : (
                          <Image
                            src={profileIconUrl(row.hit.profileIconId ?? 29)}
                            alt=""
                            aria-hidden
                            width={28}
                            height={28}
                            unoptimized
                            className="h-7 w-7 shrink-0 rounded-full border border-border"
                          />
                        )}

                        <span className="min-w-0 flex-1 truncate text-sm text-text">
                          {row.hit.gameName}
                          <span className="text-text-muted/70">#{row.hit.tagLine}</span>
                        </span>

                        <span className="shrink-0 font-mono text-[10px] uppercase tracking-label text-text-muted">
                          {regionLabel(row.hit.region)}
                        </span>

                        {!isDirect && (
                          <button
                            type="button"
                            aria-label={
                              isFavorite
                                ? `Remove ${row.hit.gameName} from favorites`
                                : `Add ${row.hit.gameName} to favorites`
                            }
                            aria-pressed={isFavorite}
                            onMouseDown={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              onToggleFavorite(row);
                            }}
                            className="shrink-0 p-1 text-text-muted transition-colors hover:text-accent"
                          >
                            <Star
                              className={`h-3.5 w-3.5 ${isFavorite ? "fill-accent text-accent" : ""}`}
                            />
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
