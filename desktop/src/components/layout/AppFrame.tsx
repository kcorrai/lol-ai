import type { ReactNode } from "react";
import { NavRail, type ScreenId } from "./NavRail";
import { StatusChip, type ConnectionState } from "./StatusChip";

/**
 * The window. A rail, a status strip, and the screen.
 *
 * Deliberately not the website's `AppShell`: that one carries a 224px sidebar, a top bar
 * with search and notifications, and a mobile bottom nav, all of which assume a browser
 * tab's worth of room. This is a companion window sitting next to a game.
 */
export function AppFrame({
  active,
  onSelect,
  connection,
  children,
}: {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
  connection: ConnectionState;
  children: ReactNode;
}): React.ReactElement {
  return (
    // No ground of its own: `body` already carries the ink fill *and* the 32px instrument
    // grid the design system layers over it (ADR-015, "layered, never flat"). Painting
    // `bg-background` here would cover the grid with the same colour and flatten it.
    <div className="flex h-screen overflow-hidden">
      <NavRail active={active} onSelect={onSelect} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-line-1 bg-surface-dark px-4">
          <span className="font-display text-xs font-bold uppercase tracking-[0.12em] text-text">
            LoL AI&nbsp;<span className="text-accent">Coach</span>
          </span>
          <StatusChip state={connection} />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
