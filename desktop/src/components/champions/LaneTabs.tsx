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
            onClick={() => onSelect(lane)}
            className={cn(
              "flex-1 px-2 py-2 font-display text-[11px] font-bold uppercase tracking-[0.08em] transition-colors duration-150",
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
