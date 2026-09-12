"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";
import { coreTracks, roleTracks } from "@/domains/academy/curriculum";

const TAB =
  "flex-none whitespace-nowrap border-b-2 px-3.5 py-3.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-colors";

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
    { href: "/academy/champion", label: "Champions" },
  ];

  return (
    <div className="border-b border-line-1 bg-background">
      <div
        data-subnav
        className="mx-auto flex max-w-[1240px] items-center gap-0.5 overflow-x-auto px-5 md:px-8"
      >
        <span className="flex flex-none items-center gap-2 pr-4 text-accent">
          <GraduationCap className="h-4 w-4" strokeWidth={1.75} />
          <span className="font-display text-[13px] font-extrabold uppercase tracking-[0.1em]">
            Academy
          </span>
        </span>

        <nav className="flex items-center gap-0.5">
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
                className={`${TAB} ${
                  active
                    ? "border-b-accent text-accent"
                    : "border-b-transparent text-text-muted hover:text-text"
                }`}
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
