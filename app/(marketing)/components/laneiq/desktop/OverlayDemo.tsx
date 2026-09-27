"use client";

import { OverlayVisual } from "./OverlayVisual";
import { OVERLAY_FINAL, overlayFrame } from "./overlayDemoTimeline";
import { useDemoClock } from "../useDemoClock";

/**
 * The overlay drawing with its "This game" panel reading a game as it is played: CS and gold
 * per minute climbing, a kill and an assist landing. The other two panels stay still because
 * the real ones do (see `overlayDemoTimeline.ts`).
 */
export function OverlayDemo({ compact = false }: { compact?: boolean }): React.ReactElement {
  const { ref, elapsed } = useDemoClock<HTMLDivElement>();
  const game = elapsed === null ? OVERLAY_FINAL : overlayFrame(elapsed);
  return (
    <div ref={ref}>
      <OverlayVisual compact={compact} game={game} />
    </div>
  );
}
