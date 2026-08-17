"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, X } from "lucide-react";
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
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <Link href="/coaches" className="flex shrink-0 items-baseline gap-1.5">
            <span className="font-display text-sm font-bold tracking-tight text-text">LaneIQ</span>
            <span className="font-display text-sm font-bold tracking-tight text-accent">
              Coaching
            </span>
          </Link>

          <nav className="hidden flex-1 items-center gap-1 md:flex">
            {nav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </nav>

          <Link
            href="/dashboard"
            className="ml-auto hidden items-center gap-1.5 text-xs text-text-faint transition-colors hover:text-text-muted md:flex"
          >
            <ArrowLeft className="h-3 w-3" aria-hidden />
            Back to LaneIQ
          </Link>

          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="ml-auto rounded-md p-2 text-text-muted hover:bg-surface-2 hover:text-text md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {open && (
          <nav className="flex flex-col gap-1 border-t border-border px-4 py-3 md:hidden">
            {nav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} onClick={() => setOpen(false)} />
            ))}
            <Link
              href="/dashboard"
              className="mt-2 flex items-center gap-1.5 px-3 py-2 text-xs text-text-faint"
            >
              <ArrowLeft className="h-3 w-3" aria-hidden />
              Back to LaneIQ
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border px-4 py-5">
        <p className="mx-auto max-w-6xl text-xs text-text-faint">
          Coaching on LaneIQ. Every rank on a coach profile is read from a linked Riot account and
          dated — never typed in by the coach.
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
        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
        active ? "bg-accent/15 text-accent" : "text-text-muted hover:bg-surface-2 hover:text-text"
      )}
    >
      {item.label}
    </Link>
  );
}
