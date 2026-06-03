"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Gamepad2 } from "lucide-react";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useUIStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

export function RiotAccountSelector() {
  const pathname = usePathname();
  const { data: accounts = [] } = useRiotAccounts();
  const activeId = useUIStore((s) => s.activeRiotAccountId);
  const setActiveId = useUIStore((s) => s.setActiveRiotAccountId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (accounts.length > 0 && !activeId) {
      const primary = accounts.find((a) => a.isPrimary) ?? accounts[0];
      setActiveId(primary.id);
    }
  }, [accounts, activeId, setActiveId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (pathname !== "/dashboard" || accounts.length === 0) return null;

  const active = accounts.find((a) => a.id === activeId) ?? accounts[0];

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm",
          "text-text transition-colors hover:bg-surface-2"
        )}
      >
        <Gamepad2 className="h-3.5 w-3.5 text-accent" />
        <span className="font-medium">
          {active.gameName}
          <span className="text-text-muted">#{active.tagLine}</span>
        </span>
        <ChevronDown className={cn("h-3.5 w-3.5 text-text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-md border border-border bg-surface shadow-lg">
          <div className="p-1">
            {accounts.map((account) => (
              <button
                key={account.id}
                onClick={() => {
                  setActiveId(account.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm transition-colors",
                  account.id === activeId
                    ? "bg-accent/10 text-accent"
                    : "text-text-muted hover:bg-surface-2 hover:text-text"
                )}
              >
                <Gamepad2 className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {account.gameName}#{account.tagLine}
                </span>
                {account.isPrimary && (
                  <span className="ml-auto shrink-0 text-xs text-text-muted">primary</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
