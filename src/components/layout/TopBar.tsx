"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { RiotAccountSelector } from "./RiotAccountSelector";

export function TopBar() {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4">
      {/* Logo — only visible on mobile since sidebar shows it on desktop */}
      <Link href="/dashboard" className="flex items-center gap-2 md:hidden">
        <Zap className="h-5 w-5 text-accent" />
        <span className="font-display text-base font-bold text-text">LoL AI Coach</span>
      </Link>

      <div className="flex-1" />

      <RiotAccountSelector />
      <NotificationBell />
      <UserMenu />
    </header>
  );
}
