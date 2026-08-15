"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { RiotAccountSelector } from "./RiotAccountSelector";

export function TopBar() {
  return (
    // The logo, the Riot ID pill, the bell and the avatar together exceed 358px of
    // usable width on a 390px phone. min-w-0 + truncate lets the two text items
    // give way instead of pushing the page sideways.
    <header className="flex h-14 shrink-0 items-center gap-3 overflow-hidden border-b border-border bg-background px-4">
      {/* Logo — only visible on mobile since sidebar shows it on desktop */}
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2 md:hidden">
        <Zap className="h-5 w-5 shrink-0 text-accent" />
        <span className="truncate font-display text-base font-bold text-text">LoL AI Coach</span>
      </Link>

      <div className="min-w-0 flex-1" />

      <div className="min-w-0">
        <RiotAccountSelector />
      </div>
      <NotificationBell />
      <UserMenu />
    </header>
  );
}
