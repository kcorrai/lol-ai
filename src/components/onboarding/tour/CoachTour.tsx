"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SpotlightOverlay, type SpotRect } from "./SpotlightOverlay";
import { CoachMascot } from "./CoachMascot";
import { TOUR_STEPS, TOUR_STORAGE_KEY } from "./tourSteps";

// Finds the first *visible* element for a step's target/fallback data-tour ids. The desktop
// sidebar stays in the DOM but display:none on mobile (offsetParent === null), so we skip it and
// fall through to the visible BottomNav match.
function findTarget(target?: string, fallback?: string): HTMLElement | null {
  for (const sel of [target, fallback].filter(Boolean)) {
    const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${sel}"]`));
    const visible = els.find((e) => e.offsetParent !== null || e.getBoundingClientRect().width > 0);
    if (visible) return visible;
  }
  return null;
}

export function CoachTour(): React.JSX.Element | null {
  const [active, setActive] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<SpotRect | null>(null);

  useEffect(() => setMounted(true), []);

  // First-run gate.
  useEffect(() => {
    try {
      if (!localStorage.getItem(TOUR_STORAGE_KEY)) setActive(true);
    } catch {
      /* localStorage unavailable — skip the tour */
    }
  }, []);

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setActive(false);
  }, []);

  const step = TOUR_STEPS[index];

  // Track the current target's rect; follows scroll/resize/layout via rAF, no-op re-renders skipped.
  useEffect(() => {
    if (!active) return;
    if (!step.target && !step.fallback) {
      setRect(null);
      return;
    }
    const initial = findTarget(step.target, step.fallback);
    if (!initial) {
      setRect(null);
      return;
    }
    initial.scrollIntoView({ block: "center", behavior: "smooth" });

    const pad = step.padding ?? 0;
    let raf = 0;
    const tick = () => {
      const el = findTarget(step.target, step.fallback);
      if (el) {
        const r = el.getBoundingClientRect();
        const next: SpotRect = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
        setRect((prev) =>
          prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height
            ? prev
            : next
        );
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, step]);

  // Esc skips the tour.
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, finish]);

  if (!mounted || !active) return null;

  const next = () => (index < TOUR_STEPS.length - 1 ? setIndex(index + 1) : finish());
  const back = () => setIndex(Math.max(0, index - 1));

  return createPortal(
    <div className="fixed inset-0 z-[70]">
      <SpotlightOverlay rect={rect} />
      <CoachMascot step={step} rect={rect} index={index} total={TOUR_STEPS.length} onNext={next} onBack={back} onSkip={finish} />
    </div>,
    document.body,
  );
}
