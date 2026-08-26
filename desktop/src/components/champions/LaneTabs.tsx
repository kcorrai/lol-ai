import { cn } from "@/lib/cn";
import { LANE_LABELS, LANES, type Lane } from "@/lib/champions";

/**
 * The five lanes, as a row of tabs.
 *
 * Words rather than the position icons the website uses: five tabs share the width of a
 * window that sits beside a game, and a five-across row of glyphs reads as decoration
 * there where five short words read as a choice.
 *
 * Not a content-policy limit, which is what this comment used to say. Data Dragon is in
 * `img-src`, and the list below now draws a portrait per row from it.
 */
export function LaneTabs({
  active,
  onSelect,
}: {
  active: Lane;
  onSelect: (lane: Lane) => void;
}): React.ReactElement {
  return (
    <div role="tablist" aria-label="Lanes" className="flex gap-px bg-line-1">
      {LANES.map((lane) => {
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
              "flex-1 cursor-pointer px-2 py-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors duration-150",
              isActive
                ? "bg-accent/15 text-accent"
                : "bg-surface-dark text-text-muted hover:bg-white/5 hover:text-text"
            )}
          >
            {LANE_LABELS[lane]}
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
