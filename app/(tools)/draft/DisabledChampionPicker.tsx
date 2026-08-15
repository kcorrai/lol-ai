"use client";

import { useMemo, useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { useAllChampions } from "@/hooks/useAllChampions";

interface Props {
  value: string[];
  onChange: (next: string[]) => void;
}

/** Champions removed from the pool before the draft starts — patch disables,
 *  house rules, a bugged champion nobody wants to see. */
export function DisabledChampionPicker({ value, onChange }: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: champions } = useAllChampions();

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return (champions ?? [])
      .filter((c) => c.name.toLowerCase().includes(q) && !value.includes(c.key))
      .slice(0, 8);
  }, [champions, query, value]);

  return (
    <div className="notch-sm border border-border bg-surface-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <span className="text-[13px] font-semibold text-text-body">
          Disabled champions
          {value.length > 0 && <span className="ml-2 text-accent">{value.length}</span>}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open && (
        <div className="border-t border-border p-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a champion to disable…"
            aria-label="Search a champion to disable"
            className="notch-sm w-full border border-border bg-surface px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:border-accent focus:outline-none"
          />

          {matches.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1">
              {matches.map((champion) => (
                <li key={champion.key}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange([...value, champion.key]);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-[13px] text-text-body hover:bg-surface"
                  >
                    <ChampionIcon name={champion.key} size={22} />
                    {champion.name}
                  </button>
                </li>
              ))}
            </ul>
          )}

          {value.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {value.map((key) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((k) => k !== key))}
                    aria-label={`Re-enable ${key}`}
                    className="tag-cut inline-flex items-center gap-1.5 border border-border bg-surface px-2 py-1 text-[11.5px] text-text-body hover:border-danger hover:text-danger"
                  >
                    <ChampionIcon name={key} size={16} />
                    {key}
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
