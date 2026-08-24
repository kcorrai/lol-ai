import type { LucideIcon } from "lucide-react";
import { Gamepad2, Link2, Settings, Swords } from "lucide-react";
import { cn } from "@/lib/cn";

export type ScreenId = "game" | "champions" | "pairing" | "settings";

const ITEMS: ReadonlyArray<{ id: ScreenId; icon: LucideIcon; label: string }> = [
  { id: "game", icon: Gamepad2, label: "Game" },
  // Second, under the game: it is the only screen worth opening when there is no match
  // running, which is most of the time this window is on screen.
  { id: "champions", icon: Swords, label: "Champions" },
  { id: "pairing", icon: Link2, label: "Pairing" },
  { id: "settings", icon: Settings, label: "Settings" },
];

/**
 * Icon-only, because a companion window is narrow and every pixel it takes is one the
 * player is not spending on the game. The active marker is the website's: an accent bar
 * on the leading edge over a fading accent wash.
 */
export function NavRail({
  active,
  onSelect,
}: {
  active: ScreenId;
  onSelect: (id: ScreenId) => void;
}): React.ReactElement {
  return (
    <nav
      aria-label="Sections"
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-line-1 bg-surface-dark py-3"
    >
      {ITEMS.map(({ id, icon: Icon, label }) => {
        const isActive = id === active;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            aria-current={isActive ? "page" : undefined}
            title={label}
            className={cn(
              "relative flex h-10 w-10 items-center justify-center transition-colors duration-150",
              isActive
                ? "bg-gradient-to-r from-accent/20 via-accent/10 to-transparent text-accent"
                : "text-text-muted hover:bg-white/5 hover:text-text"
            )}
          >
            {isActive ? (
              <span
                aria-hidden
                className="absolute left-0 h-[calc(100%-10px)] w-0.5 rounded-full bg-accent"
              />
            ) : null}
            <Icon className="h-4 w-4" aria-hidden />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
