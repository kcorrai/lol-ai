"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ChevronDown, Gamepad2, RefreshCw } from "lucide-react";
import { profileIconUrl } from "@/lib/ddragon";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useSyncAccount } from "@/hooks/useSyncAccount";
import { useUIStore } from "@/lib/stores/uiStore";
import { cn } from "@/lib/utils";

function SummonerAvatar({ iconId, size = 20 }: { iconId: number; size?: number }) {
  const [errored, setErrored] = useState(false);
  if (errored) return <Gamepad2 className="shrink-0 text-accent" style={{ width: size, height: size }} />;
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
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-border px-3 py-1.5 text-sm",
          "text-text transition-colors hover:bg-surface-2"
        )}
      >
        <SummonerAvatar iconId={active.profileIconId} size={20} />
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
                <SummonerAvatar iconId={account.profileIconId} size={16} />
                <span className="truncate">
                  {account.gameName}#{account.tagLine}
                </span>
                {account.isPrimary && (
                  <span className="ml-auto shrink-0 text-xs text-text-muted">primary</span>
                )}
              </button>
            ))}
          </div>
          <div className="border-t border-border p-1">
            <button
              onClick={() => { handleSync(); setOpen(false); }}
              disabled={isSyncing}
              className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-text-muted transition-colors hover:bg-surface-2 hover:text-text disabled:opacity-50"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              {isSyncing ? "Yenileniyor…" : "Veriyi Yenile"}
              {syncMsg && <span className="ml-auto text-xs text-accent">{syncMsg}</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
