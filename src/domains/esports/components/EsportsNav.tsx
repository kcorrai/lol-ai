"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export interface Tab {
  label: string;
  href: string;
  /** Other paths that belong under this tab, e.g. a team's players. */
  also?: string[];
}

export const TABS: Tab[] = [
  { label: "Overview", href: "/esports" },
  { label: "Schedule", href: "/esports/schedule", also: ["/esports/matches"] },
  { label: "Tournaments", href: "/esports/tournaments" },
  { label: "Leagues", href: "/esports/leagues" },
  { label: "Teams", href: "/esports/teams", also: ["/esports/players"] },
  { label: "Pro meta", href: "/esports/champions" },
  { label: "VODs", href: "/esports/vods" },
];

export function isActive(tab: Tab, pathname: string): boolean {
  if (tab.href === "/esports") return pathname === "/esports";
  return [tab.href, ...(tab.also ?? [])].some(
    (root) => pathname === root || pathname.startsWith(`${root}/`)
  );
}

/**
 * The section's own navigation, on every esports page.
 *
 * Teams, the pro meta and the VOD archive were reachable only through links
 * buried in other pages' copy, so a reader who landed on a match had no way to
 * see what else the section held. `actions` sits at the far end for the
 * section's viewer settings.
 */
export function EsportsNav({ actions }: { actions?: React.ReactNode }): React.ReactElement {
  const pathname = usePathname() ?? "";
  const navRef = useRef<HTMLElement>(null);

  // On a phone the row scrolls, and "Teams" or "VODs" can start off-screen —
  // the tab for the page being read is brought into view.
  useEffect(() => {
    const active = navRef.current?.querySelector<HTMLElement>('[aria-current="page"]');
    const nav = navRef.current;
    if (!active || !nav) return;
    nav.scrollLeft = active.offsetLeft - (nav.clientWidth - active.offsetWidth) / 2;
  }, [pathname]);

  return (
    <div className="border-b border-border bg-surface-dark">
      <div className="mx-auto flex max-w-[1240px] items-center gap-3 px-5 md:px-8">
        <nav
          ref={navRef}
          aria-label="Esports"
          className="-mb-px flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {TABS.map((tab) => {
            const active = isActive(tab, pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`shrink-0 border-b-2 px-3 py-3 font-mono text-[11px] uppercase tracking-label transition-colors ${
                  active
                    ? "border-accent text-text"
                    : "border-transparent text-text-muted hover:text-text"
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
