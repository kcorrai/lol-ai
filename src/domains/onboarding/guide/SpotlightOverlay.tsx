import { ChevronRight } from "lucide-react";

export interface SpotRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Clash-Royale spotlight. Unlike the retired tour overlay (which swallowed every click), this one
// is *click-through on the target*: four dim panels tile the viewport around the target rect and
// absorb clicks, while the rect itself is left uncovered so the real element underneath stays
// interactive. Centered steps (no rect) dim the whole screen.
export function SpotlightOverlay({
  rect,
  hasTarget,
}: {
  rect: SpotRect | null;
  hasTarget: boolean;
}): React.JSX.Element {
  // `pointer-events-auto` on each panel makes the dimmed areas absorb clicks (so the rest of the app
  // is unusable), while the target rect is left uncovered so clicks pass through to the real element.
  const dimBase = "fixed bg-black/75 backdrop-blur-[2px] transition-all duration-300";
  const dim = `pointer-events-auto ${dimBase}`;

  if (!rect) {
    // A centered step (no target) intentionally dims and blocks everything. But when a step *expects*
    // a target and its anchor can't be resolved (missing/renamed/off-screen), a click-blocking panel
    // would freeze the whole page — so degrade to a non-interactive dim instead of trapping the user
    // (TASK-220). The coach bubble's "Skip setup" remains available either way.
    const interactivity = hasTarget ? "pointer-events-none" : "pointer-events-auto";
    return <div className={`${dimBase} inset-0 ${interactivity}`} />;
  }

  const right = rect.left + rect.width;
  const bottom = rect.top + rect.height;

  return (
    <>
      {/* Four panels around the hole — each absorbs pointer events; the hole is left open. */}
      <div className={dim} style={{ top: 0, left: 0, right: 0, height: Math.max(0, rect.top) }} />
      <div className={dim} style={{ top: bottom, left: 0, right: 0, bottom: 0 }} />
      <div
        className={dim}
        style={{ top: rect.top, left: 0, width: Math.max(0, rect.left), height: rect.height }}
      />
      <div className={dim} style={{ top: rect.top, left: right, right: 0, height: rect.height }} />

      {/* Glowing ring hugging the lit element (never blocks its clicks). */}
      <div
        className="pointer-events-none fixed animate-glow-pulse rounded-xl ring-2 ring-accent/80 transition-all duration-300"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: "0 0 0 3px rgba(198,255,61,0.25), 0 0 22px 4px rgba(198,255,61,0.35)",
        }}
      />

      {/* Nudge chevron pointing at the target. */}
      <div
        className="pointer-events-none fixed -ml-7 animate-nudge text-accent"
        style={{ top: rect.top + rect.height / 2 - 12, left: rect.left }}
        aria-hidden
      >
        <ChevronRight className="h-6 w-6 drop-shadow-[0_0_6px_rgba(198,255,61,0.9)]" />
      </div>
    </>
  );
}
