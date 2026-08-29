"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Gamepad2, RefreshCw } from "lucide-react";
import { profileIconUrl } from "@/lib/ddragon";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useSyncAccount } from "@/hooks/useSyncAccount";
import { useUIStore } from "@/lib/stores/uiStore";
import { isStaleActiveAccountId } from "@/lib/stores/activeAccount";
import { cn } from "@/lib/utils";

function SummonerAvatar({ iconId, size = 20 }: { iconId: number; size?: number }) {
  const [errored, setErrored] = useState(false);
  if (errored)
    return <Gamepad2 className="shrink-0 text-accent" style={{ width: size, height: size }} />;
  return (
    <Image
      src={profileIconUrl(iconId)}
      alt=""
      width={size}
      height={size}
      unoptimized
      className="shrink-0 rounded-full"
      onError={() => setErrored(true)}
    />
  );
}

export function RiotAccountSelector() {
  const { data: accounts = [] } = useRiotAccounts();
  const activeId = useUIStore((s) => s.activeRiotAccountId);
  const setActiveId = useUIStore((s) => s.setActiveRiotAccountId);
  const { mutate: syncAccount, isPending: isSyncing } = useSyncAccount();
  const [open, setOpen] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Also overwrites a *stale* selection, not just an absent one. The persisted id
  // survives the account it names — a re-seeded database leaves one behind — and until
  // this cleared it the dashboard stayed pointed at an account it could not read.
  useEffect(() => {
    if (accounts.length === 0) return;
    if (activeId && !isStaleActiveAccountId(accounts, activeId)) return;
    const primary = accounts.find((a) => a.isPrimary) ?? accounts[0];
    setActiveId(primary.id);
  }, [accounts, activeId, setActiveId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);

  if (accounts.length === 0) return null;

  function handleSync() {
    const id = activeId ?? accounts[0]?.id;
    if (!id) return;
    setSyncMsg(null);
    syncAccount(id, {
      onSuccess: () => {
        setSyncMsg("Syncing…");
        setTimeout(() => setSyncMsg(null), 4000);
      },
      onError: () => setSyncMsg("Sync failed"),
    });
  }

  const active = accounts.find((a) => a.id === activeId) ?? accounts[0];

  return (
    <div className="relative" ref={ref}>
      {/* Chamfered chip, never a native <select> — the OS dropdown paints a white
          panel with a blue highlight that no stylesheet reaches (ADR-015). */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "tag-cut flex min-w-0 items-center gap-2.5 border py-1 pl-1.5 pr-2.5 transition-colors",
          open ? "border-accent bg-surface-2" : "border-line-2 bg-surface-dark hover:bg-surface-2"
        )}
      >
        <SummonerAvatar iconId={active.profileIconId} size={24} />
        <span className="grid min-w-0 gap-px text-left">
          <span className="truncate text-[13px] leading-tight text-text">
            {active.gameName}
            <span className="text-text-muted">#{active.tagLine}</span>
          </span>
          <span className="font-mono text-[10px] tracking-[0.12em] text-text-muted">
            {active.region.toUpperCase()} · LV {active.summonerLevel}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-text-muted transition-transform",
            open && "rotate-180"
          )}
          strokeWidth={1.75}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="notch absolute right-0 top-full z-50 mt-1.5 w-64 border border-line-2 bg-surface-2 p-1.5 shadow-[0_12px_32px_rgba(0,0,0,.55)]"
        >
          {accounts.map((account) => {
            const isActive = account.id === activeId;
            return (
              <button
                key={account.id}
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setActiveId(account.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2.5 px-2 py-2 text-left transition-colors",
                  isActive ? "bg-accent/10" : "hover:bg-surface"
                )}
              >
                <SummonerAvatar iconId={account.profileIconId} size={22} />
                <span className="grid min-w-0 flex-1 gap-px">
                  <span
                    className={cn("truncate text-[13px]", isActive ? "text-accent" : "text-text")}
                  >
                    {account.gameName}#{account.tagLine}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.12em] text-text-muted">
                    {account.region.toUpperCase()} · LV {account.summonerLevel}
                    {account.isPrimary && " · PRIMARY"}
                  </span>
                </span>
                {isActive && <span className="shrink-0 font-mono text-[11px] text-accent">✓</span>}
              </button>
            );
          })}

          <div className="mt-1.5 border-t border-border pt-1.5">
            <button
              onClick={() => {
                handleSync();
                setOpen(false);
              }}
              disabled={isSyncing}
              className="flex w-full items-center gap-2 px-2 py-1.5 font-mono text-[10.5px] uppercase tracking-label text-text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-50"
            >
              <RefreshCw
                className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")}
                strokeWidth={1.75}
              />
              {isSyncing ? "Refreshing…" : "Refresh now"}
              {syncMsg && (
                <span className="ml-auto normal-case tracking-normal text-accent">{syncMsg}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
