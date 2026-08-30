"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import { Wordmark } from "./laneiq/Wordmark";
import { HEADER_NAV, isMenu } from "./nav/headerNav";
import { NavMenu } from "./nav/NavMenu";
import { MobileNav } from "./nav/MobileNav";

const NAV_LINK =
  "font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:text-text";

// The header's one accent-filled control, rationed to whichever action matters
// most to the visitor: sign up when signed out, go to the dashboard when signed in.
const HEADER_CTA =
  "tag-cut flex h-8 items-center gap-1.5 bg-accent px-4 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600";

/**
 * The bar is 1440px wide while every page under it stays 1240px.
 *
 * That is deliberate and not an oversight: the container was the binding constraint on how
 * many things this product could announce, and widening the page bodies to match would be a
 * redesign of twenty-four sections to solve a problem that lives in one. Six top-level
 * entries, four of them panels, is what fits — and what keeps fitting as the eighth and
 * ninth tool ship, because those land inside `headerNav.ts` rather than on the bar.
 *
 * The bar turns on at `xl`, not `lg`. At 1024px the nav, the search box and both calls to
 * action come to about 1160px and the CTAs were being clipped off the right edge — which
 * they were before this change too, with seven flat links. A tablet gets the drawer, where
 * every destination is visible at once, rather than a bar with its sign-up button cut in half.
 */
export function MarketingHeader(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[var(--surface-glass)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-[62px] max-w-[1440px] items-center gap-7 px-5 md:px-8">
        <Link href="/" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-[22px] xl:flex">
          {HEADER_NAV.map((entry) =>
            isMenu(entry) ? (
              <NavMenu key={entry.key} menu={entry} />
            ) : (
              <Link key={entry.href} href={entry.href} className={NAV_LINK}>
                {entry.label}
              </Link>
            )
          )}
        </nav>

        {/* Search is the product's front door, so it sits in the nav on every marketing page —
            not only on the landing hero. Hidden below xl, where the drawer carries it instead. */}
        <div className="ml-auto hidden w-full max-w-[280px] xl:block">
          <PlayerSearchBar placeholder="Search a player" />
        </div>

        <div className="ml-auto hidden items-center gap-4 xl:ml-0 xl:flex">
          {isAuthenticated ? (
            <Link href="/dashboard" className={HEADER_CTA}>
              <LayoutDashboard className="h-3.5 w-3.5" strokeWidth={1.75} />
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className={NAV_LINK}>
                Log in
              </Link>
              <Link href="/register" className={HEADER_CTA}>
                Start free
              </Link>
            </>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2 xl:hidden">
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="tag-cut flex h-8 items-center whitespace-nowrap bg-accent px-3 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-background"
          >
            {isAuthenticated ? "Dashboard" : "Start free"}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="p-2 text-text-muted transition-transform hover:text-text active:scale-95"
          >
            {open ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      {open && (
        <MobileNav isAuthenticated={isAuthenticated} onNavigate={() => setOpen(false)} />
      )}
    </header>
  );
}
