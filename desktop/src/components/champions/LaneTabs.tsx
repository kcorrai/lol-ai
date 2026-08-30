import { Crosshair, Shield, Swords, Target, Trees, type LucideIcon } from "lucide-react";
import { LANES, LANE_LABELS, type Lane } from "@/lib/champions";
import { cn } from "@/lib/cn";

/**
 * The five lanes, as one row of tabs.
 *
 * The icons are new and the words are not: five glyphs alone read as decoration at this
 * width, which is why this row used to be words only. Both together is what the redesign
 * asks for and what the extra row of height buys — the icon is what the eye finds and the
 * word is what settles which lane it is.
 *
 * `stacked` puts the icon over the word for the champion browser's 380px column, where five
 * icon-beside-word tabs would not fit; `inline` keeps them side by side everywhere else.
 */
const LANE_ICONS: Record<Lane, LucideIcon> = {
  TOP: Swords,
  JUNGLE: Trees,
  MIDDLE: Crosshair,
  BOTTOM: Target,
  UTILITY: Shield,
};

export function LaneTabs({
  active,
  onSelect,
  layout = "inline",
  className,
}: {
  active: Lane;
  onSelect: (lane: Lane) => void;
  layout?: "inline" | "stacked";
  className?: string;
}): React.ReactElement {
  return (
    <div
      role="tablist"
      aria-label="Lanes"
      className={cn("grid grid-cols-5 gap-px bg-line-1", className)}
    >
      {LANES.map((lane) => {
        const Icon = LANE_ICONS[lane];
        const isActive = lane === active;

        return (
          <button
            key={lane}
            type="button"
            role="tab"
            aria-selected={isActive}
            // Roving focus, which is what a tablist means to a keyboard: one stop for the
            // whole row, and the arrows move within it. Five tabs that each take a Tab press
            // put four presses between the sidebar and the list below.
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(lane)}
            onKeyDown={(event) => {
              const next = laneFor(event.key, active);
              if (!next) return;
              event.preventDefault();
              onSelect(next);
              // The tab that has just been selected is the one that now holds the focus,
              // otherwise the arrow moves the selection and leaves the keyboard behind.
              const tabs = event.currentTarget.parentElement?.children;
              const moving = tabs?.[LANES.indexOf(next)];
              if (moving instanceof HTMLElement) moving.focus();
            }}
            className={cn(
              "cursor-pointer border-b-2 transition-colors duration-150 ease-out",
              layout === "stacked" ? "px-1.5 py-3" : "px-2.5 py-3",
              isActive
                ? "border-accent bg-accent/10 text-accent"
                : "border-transparent bg-surface text-text-muted hover:bg-white/5 hover:text-text"
            )}
          >
            <span
              className={cn(
                "flex items-center justify-center",
                layout === "stacked" ? "flex-col gap-1.5" : "gap-2"
              )}
            >
              <Icon
                aria-hidden
                className={layout === "stacked" ? "h-[15px] w-[15px]" : "h-4 w-4"}
              />
              <span
                className={cn(
                  "font-display font-bold uppercase tracking-[0.14em]",
                  layout === "stacked" ? "text-[10.5px]" : "text-[13px]"
                )}
              >
                {LANE_LABELS[lane]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/**
 * The lane an arrow press moves to, or null for a key this row does not answer.
 *
 * Wraps at both ends, which is what the pattern for a tablist asks for and what a row of
 * five short tabs makes obvious — the alternative is an arrow that stops working at the edge
 * with nothing to say why. Home and End are here because a keyboard expects them wherever
 * arrows work.
 *
 * A function rather than a branch inside the handler: this suite runs in node with no DOM,
 * so the rule it turns on has to be reachable without rendering anything.
 */
export function laneFor(key: string, active: Lane): Lane | null {
  const at = LANES.indexOf(active);

  switch (key) {
    case "ArrowRight":
      return LANES[(at + 1) % LANES.length];
    case "ArrowLeft":
      return LANES[(at - 1 + LANES.length) % LANES.length];
    case "Home":
      return LANES[0];
    case "End":
      return LANES[LANES.length - 1];
    default:
      return null;
  }
}
