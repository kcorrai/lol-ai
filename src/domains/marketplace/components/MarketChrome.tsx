"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export interface MarketNavItem {
  href: string;
  label: string;
}

interface Props {
  /** Built on the server, because whether the coach links show depends on a database row. */
  nav: MarketNavItem[];
  children: React.ReactNode;
}

/**
 * The coaching section's own shell.
 *
 * Deliberately not the app sidebar. What happens here is a different job from
 * what happens on a dashboard — a coach is running a business (bookings,
 * hours, students, earnings) and a student is dealing with a person, neither of
 * which is "look at my last twenty games". Sharing the player's chrome would
 * make both read as a sub-tab of something else.
 *
 * The way back to the app is one small link and nothing else. This is a section
 * you enter, not a page you pass through — but it is not a trap either, which
 * is the one thing "fully separate" must not be allowed to mean.
 */
export function MarketChrome({ nav, children }: Props): React.ReactElement {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line-1 bg-[var(--surface-glass)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-5 px-5 md:px-8">
          <Link href="/coaches" className="shrink-0 whitespace-nowrap">
            <span className="font-display text-base font-extrabold uppercase tracking-[0.06em] text-text">
              LaneIQ{" "}
            </span>
            <span className="font-display text-base font-extrabold uppercase tracking-[0.06em] text-accent">
              Coaching
            </span>
          </Link>

          {/* Scrolls rather than wraps: the coach nav is six items and a wrap
              would double the header height on the exact screens with least of it. */}
          <nav className="hidden flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] md:flex [&::-webkit-scrollbar]:hidden">
            {nav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <Link
            href="/dashboard"
            className="ml-auto hidden shrink-0 whitespace-nowrap font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted transition-colors hover:text-text md:block"
          >
            &larr; Back to LaneIQ
          </Link>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="ml-auto p-2 text-text-muted hover:bg-surface-2 hover:text-text md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-line-1 bg-surface px-5 py-3 md:hidden">
            {nav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                onClick={() => setOpen(false)}
              />
            ))}
            <Link
              href="/dashboard"
              className="mt-2 px-2.5 py-2 font-mono text-[10.5px] uppercase tracking-[0.16em] text-text-muted"
            >
              &larr; Back to LaneIQ
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line-1 px-5 py-5 md:px-8">
        <p className="mx-auto max-w-[1240px] font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
          Coaching on LaneIQ &middot; every rank on a coach profile is read from a linked Riot
          account and dated, never typed in by the coach &middot; not endorsed by Riot Games
        </p>
      </footer>
    </div>
  );
}

function NavLink({
  item,
  pathname,
  onClick,
}: {
  item: MarketNavItem;
  pathname: string;
  onClick?: () => void;
}): React.ReactElement {
  // Longest-prefix rather than equality, so `/coach/profile` still lights
  // `/coach` — but `/coaches` must never light `/coach`, hence the boundary.
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={cn(
        "shrink-0 whitespace-nowrap px-2.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors",
        active
          ? "tag-cut border border-accent/40 bg-accent/10 text-accent"
          : "text-text-muted hover:text-text"
      )}
    >
      {item.label}
    </Link>
  );
}
