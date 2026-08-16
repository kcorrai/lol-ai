"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";

export interface ChampionRow {
  /** Data Dragon id — what the icon and the route are keyed on. */
  key: string;
  name: string;
  href: string;
  /** Role or class. Doubles as the filter value and the tile's sub-label. */
  group: string;
  winRate: number | null;
  games: number | null;
  /** Places moved since last patch; null when the previous patch is unknown. */
  delta: number | null;
}

interface ChampionConsoleProps {
  rows: ChampionRow[];
  /** Filter chips, in order. The first is the "everything" option. */
  groups: string[];
  groupLabel: string;
  initialGroup?: string;
}

type Sort = "az" | "winRate" | "move";

const SORTS: { value: Sort; label: string }[] = [
  { value: "az", label: "A–Z" },
  { value: "winRate", label: "Win rate" },
  { value: "move", label: "Biggest move" },
];

const TAG =
  "tag-cut border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-label transition-colors";
const TAG_ON = "border-accent bg-accent/15 text-accent";
const TAG_OFF = "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text";
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function winRateTone(winRate: number | null): string {
  if (winRate === null) return "text-text-body";
  if (winRate >= 52) return "text-accent";
  if (winRate < 50) return "text-danger";
  return "text-text";
}

/** The champion index: filter console, A–Z jump strip and a grid where every tile carries data. */
export function ChampionConsole({
  rows,
  groups,
  groupLabel,
  initialGroup,
}: ChampionConsoleProps): React.ReactElement {
  const [group, setGroup] = useState(initialGroup ?? groups[0]);
  const [sort, setSort] = useState<Sort>("az");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = rows
      .filter((r) => group === groups[0] || r.group === group)
      .filter((r) => !needle || r.name.toLowerCase().includes(needle));

    const sorted = [...filtered];
    if (sort === "winRate") sorted.sort((a, b) => (b.winRate ?? 0) - (a.winRate ?? 0));
    else if (sort === "move")
      sorted.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
    else sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [rows, groups, group, sort, query]);

  // A–Z is the only sort with a meaningful heading per block; the others are one ranked run.
  const blocks = useMemo(() => {
    if (sort !== "az") {
      return [{ letter: sort === "winRate" ? "Highest win rate first" : "Biggest change this patch", rows: shown }];
    }
    const byLetter = new Map<string, ChampionRow[]>();
    for (const row of shown) {
      const letter = row.name[0].toUpperCase();
      const bucket = byLetter.get(letter);
      if (bucket) bucket.push(row);
      else byLetter.set(letter, [row]);
    }
    return [...byLetter.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([letter, r]) => ({ letter, rows: r }));
  }, [shown, sort]);

  const present = new Set(shown.map((r) => r.name[0].toUpperCase()));

  return (
    <div className="grid gap-4">
      <section className="notch grid gap-3 border border-border bg-surface px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="hud-label text-[10px]">{groupLabel}</span>
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGroup(g)}
                className={`${TAG} ${g === group ? TAG_ON : TAG_OFF}`}
              >
                {g}
              </button>
            ))}
          </div>
          <span className="hidden h-[22px] w-px bg-line-1 lg:block" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="hud-label text-[10px]">Sort</span>
            {SORTS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSort(s.value)}
                className={`${TAG} ${s.value === sort ? TAG_ON : TAG_OFF}`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <label className="ml-auto w-full lg:w-[250px]">
            <span className="sr-only">Search a champion</span>
            <span className="relative block">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a champion"
                className="notch-sm h-[34px] w-full border border-border bg-surface-dark pl-8 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none"
              />
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-line-1 pt-3">
          <span className="hud-label mr-1 text-[10px]">Jump</span>
          {LETTERS.map((letter) => (
            <a
              key={letter}
              href={`#letter-${letter}`}
              aria-disabled={!present.has(letter)}
              className={`px-1 font-mono text-[11px] tracking-[0.08em] ${
                present.has(letter) ? "text-text-body hover:text-accent" : "pointer-events-none text-ink-400"
              }`}
            >
              {letter}
            </a>
          ))}
          <span className="ml-auto font-mono text-[10.5px] uppercase tracking-label text-text-body">
            {shown.length} champions
          </span>
        </div>
      </section>

      {shown.length === 0 ? (
        <section className="notch border border-border bg-surface px-5 py-12 text-center">
          <p className="font-display text-base font-bold uppercase tracking-[0.04em] text-text">
            No champion matches &ldquo;{query}&rdquo;
          </p>
          <p className="hud-label mt-2 text-[10.5px] text-text-faint">
            Clear the {groupLabel.toLowerCase()} filter or check the spelling
          </p>
        </section>
      ) : (
        blocks.map((block) => (
          <div key={block.letter} id={sort === "az" ? `letter-${block.letter}` : undefined} className="scroll-mt-24">
            <div className="mb-2.5 flex items-center gap-3">
              <span className="font-display text-[15px] font-extrabold tracking-[0.08em] text-accent">
                {block.letter}
              </span>
              <span className="h-px flex-1 bg-line-1" />
            </div>
            <div className="grid gap-2.5 [grid-template-columns:repeat(auto-fill,minmax(184px,1fr))]">
              {block.rows.map((row) => (
                <Link
                  key={row.key}
                  href={row.href}
                  className="notch block border border-line-1 bg-surface px-3.5 py-3 transition-colors hover:border-accent/50"
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <ChampionIcon name={row.key} size={38} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] text-text">{row.name}</span>
                      <span className="mt-0.5 block font-mono text-[9.5px] uppercase tracking-label text-text-faint">
                        {row.group}
                      </span>
                    </span>
                  </span>
                  <span className="mt-2.5 flex items-center justify-between gap-2 border-t border-line-1 pt-2.5 font-mono tabular-nums">
                    <span className={`text-[13px] ${winRateTone(row.winRate)}`}>
                      {row.winRate === null ? "—" : `${row.winRate.toFixed(1)}%`}
                    </span>
                    <span
                      className={`text-[11px] ${row.delta === null || row.delta === 0 ? "text-text-faint" : row.delta > 0 ? "text-accent" : "text-danger"}`}
                    >
                      {row.delta === null || row.delta === 0
                        ? "–"
                        : `${row.delta > 0 ? "▲" : "▼"}${Math.abs(row.delta)}`}
                    </span>
                    <span className="text-[10px] tracking-[0.1em] text-text-faint">
                      {row.games === null ? "" : row.games >= 1000 ? `${Math.round(row.games / 1000)}k` : row.games}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
