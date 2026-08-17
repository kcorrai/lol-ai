"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, Menu, X } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import { Wordmark } from "./laneiq/Wordmark";

const NAV: ReadonlyArray<{ href: string; label: string }> = [
  { href: "/tools", label: "Tools" },
  { href: "/tools/tier-list", label: "Tier list" },
  { href: "/champions", label: "Champions" },
  { href: "/academy", label: "Academy" },
  { href: "/esports", label: "Esports" },
  { href: "/pricing", label: "Pricing" },
];

const NAV_LINK =
  "font-mono text-[11px] uppercase tracking-label text-text-muted transition-colors hover:text-text";

// The header's one accent-filled control, rationed to whichever action matters
// most to the visitor: sign up when signed out, go to the dashboard when signed in.
const HEADER_CTA =
  "tag-cut flex h-8 items-center gap-1.5 bg-accent px-4 font-display text-[11px] font-bold uppercase tracking-[0.1em] text-background transition-colors hover:bg-acid-400 active:bg-acid-600";

export function MarketingHeader(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-[var(--surface-glass)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-[62px] max-w-[1240px] items-center gap-7 px-5 md:px-8">
        <Link href="/" onClick={() => setOpen(false)}>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-[22px] lg:flex">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_LINK}>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Search is the product's front door, so it sits in the nav on every marketing page —
            not only on the landing hero. Hidden below lg: the 62px bar has no room for it at
            phone widths and the mobile menu carries it instead. */}
        <div className="ml-auto hidden w-full max-w-[300px] lg:block">
          <PlayerSearchBar placeholder="Search a player" />
        </div>

        <div className="ml-auto hidden items-center gap-4 lg:ml-0 lg:flex">
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

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            className="tag-cut flex h-8 items-center bg-accent px-3 font-display text-[10px] font-bold uppercase tracking-[0.1em] text-background"
          >
            {isAuthenticated ? "Dashboard" : "Start free"}
          </Link>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="p-2 text-text-muted transition-transform hover:text-text active:scale-95"
          >
            {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="flex flex-col gap-4 border-t border-border bg-background px-5 py-4 lg:hidden">
          <PlayerSearchBar placeholder="Search a player" />
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className={NAV_LINK} onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
          {!isAuthenticated && (
            <Link href="/login" className={NAV_LINK} onClick={() => setOpen(false)}>
              Log in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}
