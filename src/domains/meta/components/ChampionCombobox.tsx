"use client";

import { useMemo, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { CanonicalPosition } from "@/domains/meta/types";
import { cn } from "@/lib/utils";

export interface ChampionOption {
  key: string; // Data Dragon id, e.g. "Ahri"
  name: string; // display name
  positions?: CanonicalPosition[]; // lanes this champion plays (omitted = plays anywhere)
}

interface Props {
  champions: ChampionOption[];
  value: string | null; // selected champion key
  onSelect: (key: string | null) => void;
  placeholder?: string;
  className?: string;
  // When set, the dropdown only offers champions that play this lane. Champions
  // with no known positions are always shown (so the picker never goes empty).
  position?: CanonicalPosition;
}

// Self-contained, server-data-driven champion picker. Deliberately avoids React
// Query so it works on public tool pages without a QueryClientProvider.
export function ChampionCombobox({
  champions,
  value,
  onSelect,
  placeholder = "Select a champion…",
  className,
  position,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = useMemo(
    () => champions.find((c) => c.key === value) ?? null,
    [champions, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return champions.filter((c) => {
      // Off-lane champions are hidden when a position is enforced, but champions
      // with no role data fall through so the list is never empty.
      if (position && c.positions && c.positions.length > 0 && !c.positions.includes(position)) {
        return false;
      }
      return !q || c.name.toLowerCase().includes(q);
    });
  }, [champions, query, position]);

  function choose(key: string | null): void {
    onSelect(key);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-left transition-colors hover:border-accent/40"
      >
        {selected ? (
          <>
            <ChampionIcon name={selected.key} size={24} />
            <span className="flex-1 truncate text-sm font-medium text-text">{selected.name}</span>
          </>
        ) : (
          <span className="flex-1 text-sm text-text-muted">{placeholder}</span>
        )}
        {selected ? (
          <X
            className="h-4 w-4 shrink-0 text-text-muted hover:text-text"
            onClick={(e) => {
              e.stopPropagation();
              choose(null);
            }}
          />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
        )}
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-lg border border-border bg-surface shadow-2xl">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-4 w-4 text-text-muted" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search champions…"
              className="w-full bg-transparent text-sm text-text outline-none placeholder:text-text-muted"
            />
          </div>
          <ul className="max-h-72 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-text-muted">No champions found.</li>
            ) : (
              filtered.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={() => choose(c.key)}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-surface-2",
                      c.key === value ? "text-accent" : "text-text"
                    )}
                  >
                    <ChampionIcon name={c.key} size={24} />
                    <span className="truncate">{c.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
