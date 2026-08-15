"use client";

import Image from "next/image";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { profileIconUrl } from "@/lib/ddragon";
import type { ConnectedAccount } from "@/domains/riot/services/accountService";

interface DashboardHeaderProps {
  account: ConnectedAccount | undefined;
  isPro: boolean;
}

function syncedAgo(iso: Date | string | null | undefined): string {
  if (!iso) return "never synced";
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `synced ${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `synced ${hours}h ago` : `synced ${Math.round(hours / 24)}d ago`;
}

// Identity only — switching accounts belongs to the shell's top bar, which already
// carries RiotAccountSelector and owns the active id. A second switcher here held
// its own local state, so changing the account up there left this page unchanged.
export function DashboardHeader({ account, isPro }: DashboardHeaderProps): React.ReactElement {
  return (
    <header className="flex flex-wrap items-center gap-3.5 border-b border-border pb-4">
      <span className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text">
        Dashboard
      </span>

      {account && (
        <div className="tag-cut flex min-w-0 items-center gap-2.5 border border-line-2 bg-surface-dark py-1 pl-1.5 pr-3">
          <Image
            src={profileIconUrl(account.profileIconId)}
            alt=""
            aria-hidden
            width={28}
            height={28}
            unoptimized
            className="shrink-0 rounded-sm"
          />
          <div className="grid min-w-0 gap-px">
            <span className="truncate text-[13px] leading-tight text-text">
              {account.gameName}
              <span className="text-text-muted">#{account.tagLine}</span>
            </span>
            <span className="font-mono text-[10px] tracking-[0.12em] text-text-muted">
              {account.region.toUpperCase()} · LV {account.summonerLevel}
            </span>
          </div>
        </div>
      )}

      <span
        className={`tag-cut px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-label ${
          isPro ? "bg-accent text-background" : "border border-line-2 text-text-muted"
        }`}
      >
        {isPro ? "Pro" : "Free"}
      </span>

      <div className="ml-auto flex items-center gap-3">
        <span className="hidden font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-faint sm:inline">
          {syncedAgo(account?.lastSyncedAt)}
        </span>
        <Link
          href="/coaching/chat"
          data-tour="ask-coach"
          className="tag-cut flex h-8 items-center gap-1.5 bg-accent px-3 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600"
        >
          <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.75} />
          Ask your coach
        </Link>
      </div>
    </header>
  );
}
