import type { ReactNode } from "react";
import { AccountChip } from "./AccountChip";
import { NavSidebar } from "./NavSidebar";
import { StatusChip, type ConnectionState } from "./StatusChip";
import { useSidebarCollapsed } from "@/lib/useSidebarCollapsed";
import type { PairingState } from "@/lib/usePairing";

/**
 * The window. A sidebar, a status strip, and the screen.
 *
 * The same three pieces the website's `AppShell` has, and since the sidebar took the two
 * states the website's `Sidebar` has, the same shape: brand and navigation down the left,
 * a bar across the top, the screen under it. What it does not carry is the rest of that
 * top bar — a player search, a notification bell and an avatar menu all assume a browser
 * tab's worth of room, and this is a companion window sitting next to a game.
 *
 * The collapsed state lives here rather than in `App`: it is a fact about the frame, not
 * about which screen is open, and nothing below this needs to know.
 */
export function AppFrame({
  active,
  onSelect,
  connection,
  pairing,
  children,
}: {
  active: string;
  onSelect: (path: string) => void;
  connection: ConnectionState;
  /** Who this window is reading, for the chip in the bar. */
  pairing: PairingState;
  children: ReactNode;
}): React.ReactElement {
  const sidebar = useSidebarCollapsed();

  return (
    // No ground of its own: `body` already carries the ink fill *and* the 32px instrument
    // grid the design system layers over it (ADR-015, "layered, never flat"). Painting
    // `bg-background` here would cover the grid with the same colour and flatten it.
    <div className="flex h-screen overflow-hidden">
      <NavSidebar
        active={active}
        onSelect={onSelect}
        collapsed={sidebar.collapsed}
        onToggle={sidebar.toggle}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {/* The wordmark moved into the sidebar with the rest of the brand, which is where
            the website keeps it too. What is left here is what changes while the window is
            open: whose games are on screen, and whether a game is running. */}
        <header className="flex h-11 shrink-0 items-center justify-end gap-2 border-b border-line-1 bg-surface-dark px-3">
          <AccountChip state={pairing} onOpenPairing={() => onSelect("/pairing")} />
          <StatusChip state={connection} />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4">{children}</main>
      </div>
    </div>
  );
}
