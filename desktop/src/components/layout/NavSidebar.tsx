import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import { GROUP_LABELS, railGroups, type DesktopRoute } from "@/routes";
import { cn } from "@/lib/cn";

/**
 * The website's sidebar, in a window that sits beside a game.
 *
 * The same two states `src/components/layout/Sidebar.tsx` has on the website — `w-14` of
 * icons, or `w-56` with the section headings and the labels — down to the fill, the rule
 * colour, the active treatment and the heading type. Two products that navigate the same
 * information should not disagree about what it is called or what it looks like, and the
 * only honest way to keep that true is to draw it the same way.
 *
 * It starts collapsed. The rail's width was a decision rather than an oversight — every
 * pixel it takes is one the player is not spending on the game — so the labels are
 * something the player asks for, and the app remembers that they did.
 *
 * The items are read from `ROUTES` rather than listed again here (ADR-043), so a screen
 * cannot exist in the router and be missing from the sidebar, or the reverse.
 */
export function NavSidebar({
  active,
  onSelect,
  collapsed,
  onToggle,
}: {
  /** The current path, not a screen id — the sidebar and the router share one vocabulary. */
  active: string;
  onSelect: (path: string) => void;
  collapsed: boolean;
  onToggle: () => void;
}): React.ReactElement {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-white/5 transition-[width] duration-200",
        collapsed ? "w-14" : "w-56"
      )}
      // The website's own fill, inline there and inline here for the same reason: it is a
      // two-stop gradient with an alpha stop, which is a value rather than a token.
      style={{
        background: "linear-gradient(180deg, #08091280 0%, #050706 100%)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className={cn(
          "flex h-11 shrink-0 items-center border-b border-white/5",
          collapsed ? "justify-center px-2" : "gap-2 px-3"
        )}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-accent/15 ring-1 ring-accent/30">
          <Zap className="h-4 w-4 text-accent" aria-hidden />
        </div>
        {collapsed ? null : (
          <span className="truncate font-display text-sm font-bold tracking-wide text-text">
            LoL AI&nbsp;<span className="text-accent">Coach</span>
          </span>
        )}
      </div>

      {/* Scrolls rather than compresses. At the window's minimum height the covered list
          does not fit, and the two ways to make it fit — smaller targets, or a sidebar that
          hides what it cannot show — are both worse than one the player can move. */}
      <nav aria-label="Sections" className="min-h-0 flex-1 overflow-y-auto p-2">
        {railGroups().map(({ group, routes }, index) => (
          <div key={group} role="group" aria-label={GROUP_LABELS[group]}>
            <SectionLabel label={GROUP_LABELS[group]} collapsed={collapsed} first={index === 0} />
            {routes.map((route) => (
              <Item
                key={route.path}
                route={route}
                collapsed={collapsed}
                active={route.path === active}
                onSelect={onSelect}
              />
            ))}
          </div>
        ))}
      </nav>

      <div
        className={cn("shrink-0 border-t border-white/5 p-2", collapsed && "flex justify-center")}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Show the section names" : "Collapse to icons"}
          title={collapsed ? "Show the section names" : "Collapse to icons"}
          className="flex items-center rounded-lg p-1.5 text-text-muted/50 transition-colors hover:bg-white/5 hover:text-text"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" aria-hidden />
          ) : (
            <ChevronLeft className="h-4 w-4" aria-hidden />
          )}
        </button>
      </div>
    </aside>
  );
}

/**
 * A heading when there is width for one, a rule when there is not.
 *
 * Collapsed, this is what the rail has always drawn: a group is a line between two runs,
 * and its name is said to a screen reader by the `role="group"` above rather than to the
 * eye. The first run carries no rule, because a rule belongs between things.
 */
function SectionLabel({
  label,
  collapsed,
  first,
}: {
  label: string;
  collapsed: boolean;
  first: boolean;
}): React.ReactElement | null {
  if (collapsed) {
    if (first) return null;
    return <div className="my-1 border-t border-white/5" aria-hidden />;
  }

  return (
    <p
      aria-hidden
      className={cn(
        "mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted/40",
        first ? "mt-1" : "mt-4"
      )}
    >
      {label}
    </p>
  );
}

function Item({
  route,
  collapsed,
  active,
  onSelect,
}: {
  route: DesktopRoute;
  collapsed: boolean;
  active: boolean;
  onSelect: (path: string) => void;
}): React.ReactElement {
  const { path, label, icon: Icon } = route;

  return (
    <button
      type="button"
      onClick={() => onSelect(path)}
      aria-current={active ? "page" : undefined}
      // Only when there is nothing else to read it from. Expanded, the label is on screen,
      // and a tooltip that repeats it is one more thing to move the mouse out of the way of.
      title={collapsed ? label : undefined}
      className={cn(
        "relative flex w-full items-center rounded-lg py-2 text-sm transition-all duration-150",
        collapsed ? "justify-center px-2" : "gap-3 px-3",
        active
          ? "bg-gradient-to-r from-accent/20 via-accent/10 to-transparent font-semibold text-accent"
          : "text-text-muted hover:bg-white/5 hover:text-text"
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute left-0 top-1 h-[calc(100%-8px)] w-0.5 animate-glow-pulse rounded-full bg-accent"
        />
      ) : null}
      <Icon className={cn("h-4 w-4 shrink-0", active && "text-accent")} aria-hidden />
      {collapsed ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="truncate">{label}</span>
      )}
    </button>
  );
}
