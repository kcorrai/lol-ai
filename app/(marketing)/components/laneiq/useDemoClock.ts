"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

const TICK_MS = 90;

/**
 * The clock every landing demo plays from: milliseconds into the loop, or `null` when the
 * demo should sit still on its finished frame (reduced motion).
 *
 * It only runs while the demo is on screen and the tab is in front. Three demos on one page,
 * each ticking eleven times a second behind a closed tab or below the fold, would be paying
 * for animation nobody sees. A paused demo resumes where it stopped rather than jumping.
 *
 * Returns a ref to put on the demo's root element, which is what visibility is read from.
 */
export function useDemoClock<T extends Element>(): {
  ref: React.RefObject<T>;
  elapsed: number | null;
} {
  const reduced = useReducedMotion();
  const ref = useRef<T>(null);
  const [elapsed, setElapsed] = useState<number>(0);
  const [onScreen, setOnScreen] = useState<boolean>(false);
  const [tabVisible, setTabVisible] = useState<boolean>(true);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const sync = (): void => setTabVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const running = !reduced && onScreen && tabVisible;

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((t) => t + TICK_MS), TICK_MS);
    return () => clearInterval(id);
  }, [running]);

  return { ref, elapsed: reduced ? null : elapsed };
}
