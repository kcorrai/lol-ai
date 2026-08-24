import { ROUTES } from "@/routes";
import { cn } from "@/lib/cn";

/**
 * Icon-only, because a companion window is narrow and every pixel it takes is one the
 * player is not spending on the game. The active marker is the website's: an accent bar
 * on the leading edge over a fading accent wash.
 *
 * The items are read from `ROUTES` rather than listed again here (ADR-043), so a screen
 * cannot exist in the router and be missing from the rail, or the reverse.
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
    <nav
      aria-label="Sections"
      className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-line-1 bg-surface-dark py-3"
    >
      {ROUTES.filter((route) => route.inRail).map(({ path, icon: Icon, label }) => {
        const isActive = path === active;
        return (
          <button
            key={path}
            type="button"
            onClick={() => onSelect(path)}
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
