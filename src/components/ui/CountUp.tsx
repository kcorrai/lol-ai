"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface Props {
  value: number;
  durationMs?: number;
  className?: string;
}

// Formats a large number compactly: 38_692_282 -> "38.7M".
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(Math.round(n));
}

/**
 * The browser has one, the server does not, and the server does not need one — it renders once
 * and never repaints, so the distinction only matters on the client. React warns if you call
 * `useLayoutEffect` during SSR, hence the swap rather than the bare hook.
 */
const useBeforePaint = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Animates a count-up from 0 to `value` once, when scrolled into view. Respects
// prefers-reduced-motion (jumps straight to the final value).
export function CountUp({ value, durationMs = 1400, className }: Props) {
  /**
   * Seeded with the real number, not with 0.
   *
   * Starting at 0 meant the server-rendered HTML said 0 — so the marketing pages' central
   * claim ("Powered by N ranked games") reached every crawler that does not run scripts, and
   * every visitor with scripting off, as "Powered by 0 ranked games". The animation is a
   * decoration on top of a fact; the fact has to be in the markup.
   */
  const [display, setDisplay] = useState(value);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  /**
   * Wind it back to 0 so the count has somewhere to start, before the browser paints — in a
   * plain effect this lands after the first paint and the real number flashes for a frame.
   * Skipped entirely under prefers-reduced-motion, which leaves the final value showing.
   */
  useBeforePaint(() => {
    if (started.current) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setDisplay(0);
  }, []);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setDisplay(value);
      return;
    }

    const run = () => {
      if (started.current) return;
      started.current = true;
      let raf = 0;
      let startTs = 0;
      const tick = (ts: number) => {
        if (!startTs) startTs = ts;
        const progress = Math.min(1, (ts - startTs) / durationMs);
        // easeOutCubic
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplay(value * eased);
        if (progress < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(raf);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          run();
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [value, durationMs]);

  return (
    <span ref={ref} className={className}>
      {formatCompact(display)}
    </span>
  );
}
