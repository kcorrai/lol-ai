"use client";

import Link from "next/link";
import { PlayerSearchBar } from "@/components/search/PlayerSearchBar";
import { HEADER_NAV, isMenu } from "./headerNav";
import { DownloadCta } from "./DownloadCta";

/**
 * The same navigation, opened out.
 *
 * A phone has vertical room a 62px bar does not, so nothing collapses here: the groups
 * become headings and every destination is visible at once. That is the opposite decision
 * to the desktop bar and the right one — a drawer that made you tap twice to reach a tier
 * list would be spending the one resource this layout has plenty of.
 */
export function MobileNav({
  isAuthenticated,
  onNavigate,
}: {
  isAuthenticated: boolean;
  onNavigate: () => void;
}): React.ReactElement {
  return (
    <nav className="max-h-[calc(100vh-62px)] overflow-y-auto border-t border-border bg-background px-5 py-4 xl:hidden">
      <PlayerSearchBar placeholder="Search a player" />

      {/* At the top rather than in the list: the desktop app left `HEADER_NAV` when it became
          a control, and a drawer that opened onto eight tier-list links before mentioning it
          would put it back where it was — findable only by somebody already looking. */}
      <div className="mt-4">
        <DownloadCta block onNavigate={onNavigate} />
      </div>

      <div className="mt-5 grid gap-5">
        {HEADER_NAV.map((entry) =>
          isMenu(entry) ? (
            <div key={entry.key}>
              <p className="hud-label mb-2">{entry.label}</p>
              <div className="grid gap-2.5">
                {entry.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className="text-[14px] text-text-body transition-colors hover:text-text"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              className="font-display text-[14px] font-bold uppercase tracking-[0.05em] text-text"
            >
              {entry.label}
            </Link>
          )
        )}

        {!isAuthenticated && (
          <Link
            href="/login"
            onClick={onNavigate}
            className="font-mono text-[11px] uppercase tracking-label text-text-muted"
          >
            Log in
          </Link>
        )}
      </div>
    </nav>
  );
}
