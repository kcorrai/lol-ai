import { GROUP_LABELS, railGroups } from "@/routes";
import { cn } from "@/lib/cn";

/**
 * Icon-only, because a companion window is narrow and every pixel it takes is one the
 * player is not spending on the game. The active marker is the website's: an accent bar
 * on the leading edge over a fading accent wash.
 *
 * The items are read from `ROUTES` rather than listed again here (ADR-043), so a screen
 * cannot exist in the router and be missing from the rail, or the reverse.
 *
 * They are drawn in groups (ADR-044). An undifferentiated column of icons is legible at
 * seven and a wall at thirteen, and thirteen is where the covered list lands — but a
 * heading needs width this rail has decided not to spend. So a group is a rule between two
 * runs, and its name exists for a screen reader rather than for the eye.
 */
export function NavRail({
  active,
  onSelect,
}: {
  /** The current path, not a screen id — the rail and the router share one vocabulary. */
  active: string;
  onSelect: (path: string) => void;
}): React.ReactElement {
  return (
    // Scrolls rather than compresses. At the window's minimum height thirteen items do not
    // fit, and the two ways to make them fit — smaller targets, or a rail that hides what
    // it cannot show — are both worse than a rail the player can move.
    <nav
      aria-label="Sections"
      className="flex w-14 shrink-0 flex-col items-center gap-3 overflow-y-auto border-r border-line-1 bg-surface-dark py-3"
    >
      {railGroups().map(({ group, routes }, index) => (
        <div
          key={group}
          role="group"
          aria-label={GROUP_LABELS[group]}
          className={cn(
            "flex w-full flex-col items-center gap-1",
            // The rule belongs between runs, so the first one does not carry it.
            index > 0 && "border-t border-line-1 pt-3"
          )}
        >
          {routes.map(({ path, icon: Icon, label }) => {
            const isActive = path === active;
            return (
              <button
                key={path}
                type="button"
                onClick={() => onSelect(path)}
                aria-current={isActive ? "page" : undefined}
                title={label}
                className={cn(
                  "relative flex h-10 w-10 shrink-0 items-center justify-center transition-colors duration-150",
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
        </div>
      ))}
    </nav>
  );
}
