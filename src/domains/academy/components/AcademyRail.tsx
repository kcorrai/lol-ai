"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { coreTracks, roleTracks } from "@/domains/academy/curriculum";

const LINK =
  "font-mono text-[11px] uppercase tracking-label transition-colors whitespace-nowrap";

/**
 * The Academy's own navigation. The section reads as a separate place inside the site,
 * so it carries its own rail rather than borrowing the dashboard sidebar.
 */
export function AcademyRail(): React.ReactElement {
  const pathname = usePathname();

  // The five role paths share one entry. Listing them would put eleven links in a rail that
  // has to stay one line, and only one of the five is ever the reader's own anyway.
  const rolePaths = new Set(roleTracks().map((track) => `/academy/${track.id}`));

  const items = [
    { href: "/academy", label: "Overview" },
    ...coreTracks().map((track) => ({ href: `/academy/${track.id}`, label: track.title })),
    { href: "/academy/roles", label: "Roles" },
  ];

  return (
    <div className="border-b border-border bg-[var(--surface-glass)] backdrop-blur-[14px]">
      <div className="mx-auto flex h-11 max-w-[1240px] items-center gap-6 overflow-x-auto px-5 md:px-8">
        <span className="flex items-center gap-2 text-accent">
          <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
          <span className="font-display text-[11px] font-bold uppercase tracking-[0.1em]">
            Academy
          </span>
        </span>

        <nav className="flex items-center gap-5">
          {items.map((item) => {
            const active =
              item.href === "/academy"
                ? pathname === "/academy"
                : item.href === "/academy/roles"
                  ? pathname.startsWith("/academy/roles") ||
                    [...rolePaths].some((path) => pathname.startsWith(path))
                  : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`${LINK} ${active ? "text-accent" : "text-text-muted hover:text-text"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
