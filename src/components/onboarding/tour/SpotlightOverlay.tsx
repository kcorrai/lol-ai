import { ChevronRight } from "lucide-react";

export interface SpotRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

// Dims the whole viewport and cuts a lit "hole" around the target rect using a large-spread
// box-shadow. A transparent catcher above the page swallows clicks so the tour stays Next-driven.
export function SpotlightOverlay({ rect }: { rect: SpotRect | null }): React.JSX.Element {
  if (!rect) {
    // Centered step — uniform dim, no cutout.
    return <div className="absolute inset-0 bg-black/70" />;
  }

  return (
    <>
      {/* Click catcher — blocks interaction with the page underneath during the tour. */}
      <div className="absolute inset-0" />
      {/* Lit hole: the box-shadow paints the dim everywhere except this rect. */}
      <div
        className="pointer-events-none absolute rounded-xl ring-2 ring-accent/70 animate-glow-pulse transition-all duration-300"
        style={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.70)",
        }}
      />
      {/* Pointer nudging toward the target. */}
      <div
        className="pointer-events-none absolute -ml-6 animate-nudge text-accent transition-all duration-300"
        style={{ top: rect.top + rect.height / 2 - 12, left: rect.left }}
        aria-hidden
      >
        <ChevronRight className="h-6 w-6 drop-shadow-[0_0_6px_rgba(200,155,60,0.8)]" />
      </div>
    </>
  );
}
