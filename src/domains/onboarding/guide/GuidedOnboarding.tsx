"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { SpotlightOverlay } from "./SpotlightOverlay";
import { CoachBubble } from "./CoachBubble";
import { useGuidedOnboarding } from "./useGuidedOnboarding";

// Forced, cross-page "first journey" onboarding (TASK-217). Mounted once at the app shell so it
// survives navigation; only rendered for users whose onboarding is not yet complete.
export function GuidedOnboarding({ userId }: { userId: string | null }): React.JSX.Element | null {
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const { active, step, index, total, rect, stepHasTarget, manualAdvance, goTo, dismiss } =
    useGuidedOnboarding(userId);

  useEffect(() => setContainer(document.body), []);

  if (!active || !container) return null;

  return createPortal(
    // The container itself must not capture pointer events, or it would swallow clicks over the
    // spotlight hole. Its children (dim panels, bubble) opt back in with `pointer-events-auto`.
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <SpotlightOverlay rect={rect} hasTarget={stepHasTarget} />
      <CoachBubble
        step={step}
        rect={rect}
        index={index}
        total={total}
        onManualAdvance={manualAdvance}
        onGoTo={goTo}
        onDismiss={dismiss}
      />
    </div>,
    container
  );
}
