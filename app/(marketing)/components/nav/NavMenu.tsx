"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { HeaderMenu } from "./headerNav";

/**
 * One dropdown on the top bar.
 *
 * Hand-rolled on the pattern `src/components/layout/UserMenu.tsx` already uses — a ref, a
 * `mousedown` listener, and state — rather than pulling in a menu library for six panels.
 * Escape and roving focus are the parts UserMenu leaves out and a navigation menu cannot:
 * this is the site's index of itself, so it has to be reachable without a mouse.
 *
 * It opens on click, not on hover. A panel that opens because the pointer crossed it on its
 * way to the search box is a panel that fights the visitor, and there is no hover on a
 * touchscreen to fall back on.
 */
export function NavMenu({ menu }: { menu: HeaderMenu }): React.ReactElement {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLAnchorElement | null>>([]);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(e: MouseEvent): void {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent): void {
      if (e.key !== "Escape") return;
      setOpen(false);
      // Focus goes back to the trigger rather than to the top of the document, so Escape
      // leaves the keyboard where it was instead of restarting the tab order.
      buttonRef.current?.focus();
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function focusItem(index: number): void {
    const items = itemRefs.current.filter(Boolean);
    if (items.length === 0) return;
    const wrapped = (index + items.length) % items.length;
    items[wrapped]?.focus();
  }

  function onPanelKey(e: React.KeyboardEvent<HTMLDivElement>): void {
    const delta = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (delta === 0) return;
    e.preventDefault();
    const current = itemRefs.current.findIndex((el) => el === document.activeElement);
    focusItem(current + delta);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={`nav-panel-${menu.key}`}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (e.key !== "ArrowDown") return;
          e.preventDefault();
          setOpen(true);
          // The panel has not rendered yet on the frame this fires.
          requestAnimationFrame(() => focusItem(0));
        }}
        className={`flex items-center gap-1 font-mono text-[11px] uppercase tracking-label transition-colors ${
          open ? "text-text" : "text-text-muted hover:text-text"
        }`}
      >
        {menu.label}
        <ChevronDown
          aria-hidden
          className={`h-3 w-3 transition-transform duration-[160ms] ${open ? "rotate-180" : ""}`}
          strokeWidth={2}
        />
      </button>

      {open && (
        <div
          id={`nav-panel-${menu.key}`}
          onKeyDown={onPanelKey}
          className="notch absolute left-0 top-full z-50 mt-3 w-[300px] border border-border bg-surface p-2 shadow-[0_18px_40px_-12px_rgba(0,0,0,.7)]"
        >
          {/* The system's signature for a live surface: one accent hairline on the top edge. */}
          <span aria-hidden className="absolute inset-x-0 top-0 h-px bg-accent" />

          {menu.items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              onClick={() => setOpen(false)}
              className="group block px-3 py-2 transition-colors hover:bg-surface-2 focus-visible:bg-surface-2"
            >
              <span className="font-display text-[13px] font-bold uppercase tracking-[0.05em] text-text-body transition-colors group-hover:text-text group-focus-visible:text-text">
                {item.label}
              </span>
              {item.hint ? (
                <span className="mt-0.5 block text-[12px] leading-snug text-text-muted">
                  {item.hint}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
