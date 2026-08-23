"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { TierPodium } from "./TierPodium";
import { TierTable } from "./TierTable";
import {
  sortEntries,
  defaultDirectionFor,
  DEFAULT_SORT,
  type SortColumn,
  type SortDirection,
  type TierRow,
} from "./sortEntries";

/** A navigation chip. Built on the server so this component never imports the meta barrel. */
export interface TierListTab {
  label: string;
  href: string;
  active: boolean;
}

interface TierListConsoleProps {
  entries: TierRow[];
  modeTabs: TierListTab[];
  laneTabs: TierListTab[] | null; // null in ARAM, which has no lanes
  rankTabs: TierListTab[];
  regionTabs: TierListTab[] | null; // null in ARAM, which op.gg does not split by platform
  roleLabel: string;
  hrefBase: string;
  showBan: boolean;
  showMovement: boolean;
  showPro: boolean;
}

const TAG =
  "tag-cut border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-label transition-colors";
const TAG_ON = "border-accent bg-accent/15 text-accent";
const TAG_OFF = "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text";

function TagRow({ label, tabs }: { label: string; tabs: TierListTab[] }): React.ReactElement {
  return (
    <>
      <span className="hud-label text-[10px]">{label}</span>
      {tabs.map((tab) => (
        <Link key={tab.href} href={tab.href} className={`${TAG} ${tab.active ? TAG_ON : TAG_OFF}`}>
          {tab.label}
        </Link>
      ))}
    </>
  );
}

/** The filter console, the top-three podium and the ranking table — everything that reacts. */
export function TierListConsole({
  entries,
  modeTabs,
  laneTabs,
  rankTabs,
  regionTabs,
  roleLabel,
  hrefBase,
  showBan,
  showMovement,
  showPro,
}: TierListConsoleProps): React.ReactElement {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortColumn>(DEFAULT_SORT.column);
  const [direction, setDirection] = useState<SortDirection>(DEFAULT_SORT.direction);

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? entries.filter((e) => e.name.toLowerCase().includes(needle))
      : entries;
    return sortEntries(filtered, sort, direction);
  }, [entries, query, sort, direction]);

  // A repeat click on the active column reverses it; a new column opens on whichever
  // direction reads best-first for that metric.
  function toggleSort(next: SortColumn): void {
    if (next === sort) {
      setDirection((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSort(next);
    setDirection(defaultDirectionFor(next));
  }

  return (
    <div className="grid gap-5">
      <section className="notch grid gap-3.5 border border-border bg-surface px-4 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {modeTabs.map((tab) => (
              <Link
                key={tab.href}
                href={tab.href}
                className={`${TAG} ${tab.active ? TAG_ON : TAG_OFF}`}
              >
                {tab.label}
              </Link>
            ))}
          </div>
          {laneTabs && (
            <>
              <span className="hidden h-[22px] w-px bg-line-1 sm:block" />
              <div className="flex flex-wrap items-center gap-1.5">
                <TagRow label="Lane" tabs={laneTabs} />
              </div>
            </>
          )}
          <label className="ml-auto w-full sm:w-[230px]">
            <span className="sr-only">Search champion</span>
            <span className="relative block">
              <Search
                aria-hidden
                className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted"
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search champion"
                className="notch-sm h-[34px] w-full border border-border bg-surface-dark pl-8 pr-3 text-sm text-text placeholder:text-text-muted focus:border-accent/50 focus:outline-none"
              />
            </span>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-t border-line-1 pt-3">
          <TagRow label="Rank" tabs={rankTabs} />
          <span className="ml-auto flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-text-body">
            <span className="h-1.5 w-1.5 animate-pulse bg-accent" />
            Live · rebuilt every patch
          </span>
        </div>

        {regionTabs && (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-line-1 pt-3">
            <TagRow label="Region" tabs={regionTabs} />
          </div>
        )}
      </section>

      {shown.length === 0 ? (
        <section className="notch border border-border bg-surface px-5 py-11 text-center">
          <p className="font-display text-base font-bold uppercase tracking-[0.04em] text-text">
            No champion matches &ldquo;{query}&rdquo;
          </p>
          <p className="hud-label mt-2 text-[10.5px] text-text-faint">
            Check the spelling or clear the lane filter
          </p>
        </section>
      ) : (
        <>
          <TierPodium entries={shown} roleLabel={roleLabel} hrefBase={hrefBase} />
          <TierTable
            entries={shown}
            sort={sort}
            direction={direction}
            onSort={toggleSort}
            hrefBase={hrefBase}
            showBan={showBan}
            showMovement={showMovement}
            showPro={showPro}
          />
        </>
      )}

      <div className="flex flex-wrap justify-between gap-4 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
        <span>
          {shown.length} champions · {roleLabel}
        </span>
        <span>
          Tier is win rate weighted by pick rate and matchup spread · not endorsed by Riot Games
        </span>
      </div>
    </div>
  );
}
