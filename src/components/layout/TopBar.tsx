"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import { NotificationBell } from "./NotificationBell";
import { UserMenu } from "./UserMenu";
import { RiotAccountSelector } from "./RiotAccountSelector";

export function TopBar() {
  return (
    // The logo, the Riot ID pill, the bell and the avatar together exceed 358px of
    // usable width on a 390px phone. min-w-0 + truncate lets the two text items
    // give way instead of pushing the page sideways.
    //
    // `overflow-x-clip` rather than `overflow-hidden`: the horizontal protection above is the
    // point, but `hidden` forces the vertical axis to clip too, which would cut the search
    // dropdown off at the bar's edge.
    <header className="flex h-14 shrink-0 items-center gap-3 overflow-x-clip border-b border-border bg-background px-4">
      {/* Logo — only visible on mobile since sidebar shows it on desktop */}
      <Link href="/dashboard" className="flex min-w-0 items-center gap-2 md:hidden">
        <Zap className="h-5 w-5 shrink-0 text-accent" />
        <span className="truncate font-display text-base font-bold text-text">LoL AI Coach</span>
      </Link>

      {/* Only from lg: at 390px the bar is already 12px over budget without it (TASK-295). */}
      <div className="hidden min-w-0 flex-1 lg:block">
        <div className="max-w-[320px]">
          <PlayerSearchBar placeholder="Search a player" />
        </div>
      </div>
      <div className="min-w-0 flex-1 lg:hidden" />

      <div className="min-w-0">
        <RiotAccountSelector />
      </div>
      <NotificationBell />
      <UserMenu />
    </header>
  );
}
