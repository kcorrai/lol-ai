"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { REGIONS, regionLabel } from "@/lib/riot/regions";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (region: string) => void;
  /**
   * Fires when the menu opens or closes. The search bar uses it to put its suggestions panel away
   * first — both overlays hang off the same edge, so leaving them open together makes whichever
   * renders last swallow the other's clicks (TASK-317).
   */
  onOpenChange?: (open: boolean) => void;
}

/**
 * The platform chip inside the search box.
 *
 * Not a native `<select>`: the OS paints its option list as a white panel with a blue highlight
 * that no stylesheet reaches, which is why TASK-295 removed every one of them from the product
 * (ADR-015). This is the same chamfered-chip pattern as `RiotAccountSelector`.
 */
export function RegionPicker({ value, onChange, onOpenChange }: Props): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Both refs keep the document listeners below subscribed once: the callback may be a fresh
  // closure on every parent render, and reading `open` directly would go stale inside them.
  const notifyRef = useRef(onOpenChange);
  notifyRef.current = onOpenChange;
  const openRef = useRef(false);

  const changeOpen = useCallback((next: boolean) => {
    if (openRef.current === next) return;
    openRef.current = next;
    setOpen(next);
    notifyRef.current?.(next);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) changeOpen(false);
    }
    function handleKey(e: KeyboardEvent): void {
      if (e.key === "Escape") changeOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [changeOpen]);

  return (
    <div className="relative h-full shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => changeOpen(!openRef.current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Region: ${regionLabel(value)}`}
        className={cn(
          "flex h-full items-center gap-1 border-l border-border px-2.5 font-mono text-[11px] uppercase tracking-label transition-colors",
          open ? "text-accent" : "text-text-body hover:text-text",
        )}
      >
        {regionLabel(value)}
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Region"
          // z-60 outranks the suggestions panel's z-50 on purpose: the parent closes that panel
          // when this menu opens, and this keeps the options clickable even if it ever does not.
          className="notch absolute right-0 top-[calc(100%+6px)] z-[60] max-h-[260px] w-28 overflow-y-auto border border-line-2 bg-surface-2 p-1 shadow-[0_12px_32px_rgba(0,0,0,.55)]"
        >
          {REGIONS.map((r) => (
            <button
              key={r.value}
              type="button"
              role="option"
              aria-selected={r.value === value}
              onClick={() => {
                onChange(r.value);
                changeOpen(false);
              }}
              className={cn(
                "flex w-full items-center px-2 py-1.5 text-left font-mono text-[11px] uppercase tracking-label transition-colors",
                r.value === value ? "bg-accent/10 text-accent" : "text-text-body hover:bg-surface",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
