"use client";

import { useState } from "react";
import { Bookmark, Loader2, X } from "lucide-react";
import { describeFilters } from "@/domains/match/archive/archiveLabels";
import { isEmptyFilters } from "@/domains/match/archive/archiveQuery";
import {
  useDeleteSavedSearch,
  useSaveSearch,
  useSavedSearches,
} from "@/hooks/useSavedSearches";
import type { ArchiveFilters } from "@/domains/match/services/matchArchiveFilters";
import { cn } from "@/lib/utils";

interface SavedSearchBarProps {
  filters: ArchiveFilters;
  onApply: (filters: ArchiveFilters) => void;
}

export function SavedSearchBar({ filters, onApply }: SavedSearchBarProps): React.JSX.Element {
  const { data: searches = [], isLoading } = useSavedSearches();
  const save = useSaveSearch();
  const remove = useDeleteSavedSearch();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Saving "no filters at all" saves nothing — every archive already opens on that search.
  const canSave = name.trim().length > 0 && !isEmptyFilters(filters);

  function handleSave(event: React.FormEvent): void {
    event.preventDefault();
    if (!canSave) return;
    setError(null);
    save.mutate(
      { name: name.trim(), filters },
      { onSuccess: () => setName(""), onError: (err) => setError(err.message) }
    );
  }

  return (
    <section aria-label="Saved searches" className="notch border border-line-1 bg-surface p-3">
      <form onSubmit={handleSave} className="flex items-center gap-2">
        <Bookmark className="h-3.5 w-3.5 shrink-0 text-fg-4" aria-hidden />
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
          placeholder={
            isEmptyFilters(filters) ? "Set a filter to save a search" : "Name this search"
          }
          aria-label="Name this search"
          className="h-8 min-w-0 flex-1 border border-line-2 bg-surface-dark px-2 text-[12px] text-fg-1 placeholder:text-fg-4 focus:border-acid-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!canSave || save.isPending}
          className="tag-cut shrink-0 border border-line-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-label text-fg-2 transition-colors hover:border-acid-500 hover:text-acid-500 disabled:opacity-40 disabled:hover:border-line-2 disabled:hover:text-fg-2"
        >
          {save.isPending ? "Saving…" : "Save"}
        </button>
      </form>

      {error && <p className="mt-2 text-[11px] text-danger">{error}</p>}

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-fg-4" aria-hidden />}
        {!isLoading && searches.length === 0 && (
          <p className="text-[11px] text-fg-4">
            No saved searches yet. Build a search and give it a name to keep it.
          </p>
        )}
        {searches.map((search) => (
          <span
            key={search.id}
            className={cn(
              "tag-cut flex items-center border border-line-2 text-[11px] transition-colors",
              "hover:border-line-3"
            )}
          >
            <button
              type="button"
              onClick={() => onApply(search.filters)}
              title={describeFilters(search.filters).join(" · ") || "No filters"}
              className="max-w-[220px] truncate py-1 pl-2 pr-1 text-fg-2 hover:text-acid-500"
            >
              {search.name}
            </button>
            <button
              type="button"
              onClick={() => remove.mutate(search.id)}
              disabled={remove.isPending}
              aria-label={`Delete saved search ${search.name}`}
              className="py-1 pl-0.5 pr-1.5 text-fg-4 hover:text-danger disabled:opacity-40"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}
