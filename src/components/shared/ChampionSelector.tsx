"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChampionIcon } from "@/components/ui/ChampionIcon";

interface Champion {
  id: number;
  key: string;
  name: string;
  imageUrl: string;
  roles: string[];
}

export interface ChampionSelectorProps {
  value: string | null;
  onChange: (champion: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  excludeChampions?: string[];
  filterByRoles?: string[];
  className?: string;
}

const ICON_SIZE: Record<NonNullable<ChampionSelectorProps["size"]>, number> = {
  sm: 24,
  md: 32,
  lg: 40,
};

function useAllChampions() {
  return useQuery<Champion[]>({
    queryKey: ["champions", "all"],
    queryFn: () =>
      fetch("/api/champions/all")
        .then((r) => r.json())
        .then((d) => d.data),
    staleTime: Infinity,
  });
}

export function ChampionSelector({
  value,
  onChange,
  placeholder = "Select champion...",
  disabled = false,
  size = "md",
  excludeChampions = [],
  filterByRoles,
  className,
}: ChampionSelectorProps) {
  const { data: allChampions = [] } = useAllChampions();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const iconSize = ICON_SIZE[size];

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return allChampions.filter(
      (c) =>
        !excludeChampions.includes(c.name) &&
        (q === "" || c.name.toLowerCase().includes(q)) &&
        (!filterByRoles || c.roles.some((r) => filterByRoles.includes(r)))
    );
  }, [allChampions, query, excludeChampions, filterByRoles]);

  const selectedChampion = allChampions.find((c) => c.name === value) ?? null;

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Reset cursor when filtered list changes
  useEffect(() => {
    setCursor(0);
  }, [filtered.length]);

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const item = listRef.current.children[cursor] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  function openDropdown() {
    if (disabled) return;
    setOpen(true);
    setQuery("");
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function select(name: string) {
    onChange(name);
    setOpen(false);
    setQuery("");
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(c + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(c - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[cursor]) select(filtered[cursor].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={openDropdown}
        disabled={disabled}
        className={cn(
          "flex w-full items-center gap-2 rounded-md border border-border bg-surface px-3 text-sm text-text",
          "hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          "disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" && "h-9",
          size === "md" && "h-10",
          size === "lg" && "h-12"
        )}
      >
        {selectedChampion ? (
          <>
            <ChampionIcon name={selectedChampion.name} size={iconSize} />
            <span className="flex-1 text-left font-medium">{selectedChampion.name}</span>
            <X
              className="h-4 w-4 shrink-0 text-text-muted hover:text-text"
              onClick={clear}
            />
          </>
        ) : (
          <>
            <Search className="h-4 w-4 shrink-0 text-text-muted" />
            <span className="flex-1 text-left text-text-muted">{placeholder}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-surface shadow-lg">
          <div className="border-b border-border p-2">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
            />
          </div>
          <ul
            ref={listRef}
            className="max-h-60 overflow-y-auto py-1"
            role="listbox"
          >
            {filtered.length === 0 && (
              <li className="px-3 py-2 text-sm text-text-muted">No results found</li>
            )}
            {filtered.map((champ, i) => (
              <li
                key={champ.id}
                role="option"
                aria-selected={champ.name === value}
                onClick={() => select(champ.name)}
                onMouseEnter={() => setCursor(i)}
                className={cn(
                  "flex cursor-pointer items-center gap-2 px-3 py-1.5 text-sm",
                  i === cursor ? "bg-surface-2 text-text" : "text-text hover:bg-surface-2"
                )}
              >
                <ChampionIcon name={champ.name} size={iconSize} />
                <span>{champ.name}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
