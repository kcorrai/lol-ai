"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { DEFAULT_REGION } from "@/lib/riot/regions";
import { MIN_QUERY_LENGTH } from "@/lib/riot/riotId";
import { playerKey, useSearchStore } from "@/lib/stores/searchStore";
import { RegionPicker } from "@/components/search/RegionPicker";
import { SearchDropdown } from "@/components/search/SearchDropdown";
import { buildSearchRows } from "@/components/search/buildSearchRows";
import { usePlayerSearch } from "@/components/search/usePlayerSearch";
import { profileHref, type SearchRow } from "@/components/search/searchTypes";

interface Props {
  placeholder?: string;
  /** Fills the width of its container; the marketing hero wants a wider box than the top bar. */
  size?: "md" | "lg";
  autoFocus?: boolean;
  /**
   * Controlled query and region. Omit both for a standalone box. The landing hero drives them so
   * that its "Analyze" button and inline preview keep working off the same input.
   */
  query?: string;
  onQueryChange?: (query: string) => void;
  region?: string;
  onRegionChange?: (region: string) => void;
}

export function PlayerSearchBar({
  placeholder = "Search a Riot ID — Name#TAG",
  size = "md",
  autoFocus = false,
  query: controlledQuery,
  onQueryChange,
  region: controlledRegion,
  onRegionChange,
}: Props): React.ReactElement {
  const router = useRouter();
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  const [open, setOpen] = useState(false);
  const [ownQuery, setOwnQuery] = useState("");
  const [ownRegion, setOwnRegion] = useState(DEFAULT_REGION);
  const query = controlledQuery ?? ownQuery;
  const region = controlledRegion ?? ownRegion;

  const setQuery = useCallback(
    (next: string) => {
      setOwnQuery(next);
      onQueryChange?.(next);
    },
    [onQueryChange]
  );
  const setRegion = useCallback(
    (next: string) => {
      setOwnRegion(next);
      onRegionChange?.(next);
      // The panel was closed to let the menu be clicked; bring it back so the hits for the platform
      // just chosen are visible without another click into the input.
      setOpen(true);
    },
    [onRegionChange]
  );

  const [activeIndex, setActiveIndex] = useState(-1);
  const { hits, isLoading } = usePlayerSearch(query, region);

  const recent = useSearchStore((s) => s.recent);
  const favorites = useSearchStore((s) => s.favorites);
  const addRecent = useSearchStore((s) => s.addRecent);
  const toggleFavorite = useSearchStore((s) => s.toggleFavorite);

  // Persisted state is read after mount, not during render: hydrating in render would not match
  // the server-rendered markup.
  useEffect(() => {
    void useSearchStore.persist.rehydrate();
  }, []);

  const rows = useMemo(
    () => buildSearchRows({ query, region, hits, recent, favorites }),
    [query, region, hits, recent, favorites]
  );

  const favoriteKeys = useMemo(() => new Set(favorites.map(playerKey)), [favorites]);

  // A shrinking list must not leave the highlight pointing past the end.
  useEffect(() => setActiveIndex((i) => (i >= rows.length ? rows.length - 1 : i)), [rows.length]);

  useEffect(() => {
    function onPointerDown(e: MouseEvent): void {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const select = useCallback(
    (row: SearchRow) => {
      addRecent({
        gameName: row.hit.gameName,
        tagLine: row.hit.tagLine,
        region: row.hit.region,
        profileIconId: row.hit.profileIconId ?? null,
      });
      setOpen(false);
      router.push(profileHref(row.hit));
    },
    [addRecent, router]
  );

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>): void {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (rows.length === 0) return;
      e.preventDefault();
      setOpen(true);
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((i) =>
        // From nothing highlighted, down enters at the top and up enters at the bottom. Falling
        // through to the modulo would send both to the first row.
        i < 0 ? (step === 1 ? 0 : rows.length - 1) : (i + step + rows.length) % rows.length
      );
      return;
    }
    if (e.key === "Enter") {
      // With nothing highlighted, Enter takes the first row — which is the best match, so a
      // player who types a full Riot ID and hits Enter goes straight there.
      const row = rows[activeIndex] ?? rows[0];
      if (row) {
        e.preventDefault();
        select(row);
      }
    }
  }

  const height = size === "lg" ? "h-12" : "h-10";

  return (
    <div ref={rootRef} className="relative w-full">
      <div
        className={`flex ${height} well items-center border border-border bg-surface-dark focus-within:border-accent`}
      >
        <Search className="ml-3 h-4 w-4 shrink-0 text-text-muted" strokeWidth={1.75} />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-opt-${activeIndex}` : undefined}
          aria-label="Search a Riot ID"
          className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-sm text-text placeholder-text-muted outline-none"
        />
        <RegionPicker
          value={region}
          onChange={setRegion}
          // The chip lives inside `rootRef`, so the outside-click handler never fires for it. Without
          // this the suggestions panel stays open over the menu and eats the option clicks.
          onOpenChange={(menuOpen) => menuOpen && setOpen(false)}
        />
      </div>

      {open && (
        <SearchDropdown
          rows={rows}
          activeIndex={activeIndex}
          isLoading={isLoading}
          hasQuery={query.trim().length >= MIN_QUERY_LENGTH}
          favoriteKeys={favoriteKeys}
          listId={listId}
          onSelect={select}
          onHover={setActiveIndex}
          onToggleFavorite={(row) =>
            toggleFavorite({
              gameName: row.hit.gameName,
              tagLine: row.hit.tagLine,
              region: row.hit.region,
              profileIconId: row.hit.profileIconId ?? null,
            })
          }
        />
      )}
    </div>
  );
}
