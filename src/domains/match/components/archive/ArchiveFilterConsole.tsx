"use client";

import { useEffect, useMemo, useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { ArchiveCoreFacets } from "@/domains/match/components/archive/ArchiveCoreFacets";
import { ArchivePlayerFacet } from "@/domains/match/components/archive/ArchivePlayerFacet";
import { ArchiveThresholdFacets } from "@/domains/match/components/archive/ArchiveThresholdFacets";
import {
  countActiveFacets,
  EMPTY_FILTERS,
  filtersToSearchParams,
} from "@/domains/match/archive/archiveQuery";
import { useArchiveOptions } from "@/hooks/useArchiveOptions";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import { cn } from "@/lib/utils";

interface ArchiveFilterConsoleProps {
  filters: ArchiveFilters;
  onApply: (filters: ArchiveFilters) => void;
  onClear: () => void;
  riotAccountId: string | null;
}

/**
 * The console edits a draft and only writes to the URL when the player applies it.
 *
 * Applying on every keystroke would put a history entry — and a request — behind each character of
 * a threshold, which makes the back button useless for the thing it is meant to do here: step back
 * to the previous *search*. Every entry in the history is a question someone actually asked.
 */
export function ArchiveFilterConsole({
  filters,
  onApply,
  onClear,
  riotAccountId,
}: ArchiveFilterConsoleProps): React.JSX.Element {
  const { data: options } = useArchiveOptions(riotAccountId);
  const [draft, setDraft] = useState<ArchiveFilters>(filters);
  const [open, setOpen] = useState(false);

  // Re-seeds the draft whenever the applied search changes underneath it — the back button, a
  // saved search, a link opened in place. Safe as a plain dependency because `useArchiveFilters`
  // memoises `filters` against the URL, so this fires when the search changes and not on every
  // render — which would wipe an edit in progress.
  useEffect(() => {
    setDraft(filters);
  }, [filters]);

  const appliedKey = filtersToSearchParams(filters).toString();
  const draftKey = filtersToSearchParams(draft).toString();
  const activeCount = useMemo(() => countActiveFacets(filters), [filters]);
  const dirty = draftKey !== appliedKey;

  function patch(next: Partial<ArchiveFilters>): void {
    setDraft((current) => ({ ...current, ...next }));
  }

  return (
    <section
      aria-label="Filters"
      className="notch border border-line-1 bg-surface lg:sticky lg:top-[72px]"
    >
      {/* On a phone the console is a disclosure — a screen of controls above the results would mean
          scrolling past every filter to reach the answer. On a laptop it is simply always open. */}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 border-b border-line-1 px-3 py-2.5 text-left lg:pointer-events-none"
      >
        <SlidersHorizontal className="h-3.5 w-3.5 text-fg-3" aria-hidden />
        <span className="font-mono text-[10.5px] uppercase tracking-label text-fg-2">Filters</span>
        {activeCount > 0 && (
          <span className="tag-cut border border-acid-500 bg-acid-500/10 px-1.5 py-px font-mono text-[10px] text-acid-500">
            {activeCount}
          </span>
        )}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-label text-fg-4 lg:hidden">
          {open ? "Hide" : "Show"}
        </span>
      </button>

      <div className={cn("space-y-5 p-3", open ? "block" : "hidden lg:block")}>
        <ArchiveCoreFacets draft={draft} onChange={patch} options={options} />

        <div className="border-t border-line-1 pt-4">
          <ArchivePlayerFacet draft={draft} onChange={patch} riotAccountId={riotAccountId} />
        </div>

        <div className="border-t border-line-1 pt-4">
          <ArchiveThresholdFacets draft={draft} onChange={patch} />
        </div>

        <div className="sticky bottom-0 -mx-3 -mb-3 flex gap-2 border-t border-line-1 bg-surface px-3 py-2.5">
          <button
            type="button"
            onClick={() => onApply(draft)}
            disabled={!dirty}
            className="tag-cut flex-1 border border-acid-500 bg-acid-500/10 px-3 py-2 font-mono text-[10.5px] uppercase tracking-label text-acid-500 transition-colors hover:bg-acid-500/20 disabled:border-line-2 disabled:bg-transparent disabled:text-fg-4"
          >
            {dirty ? "Apply search" : "Applied"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDraft(EMPTY_FILTERS);
              onClear();
            }}
            disabled={activeCount === 0 && !dirty}
            className="tag-cut border border-line-2 px-3 py-2 font-mono text-[10.5px] uppercase tracking-label text-fg-3 transition-colors hover:border-line-3 hover:text-fg-1 disabled:opacity-40"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}
