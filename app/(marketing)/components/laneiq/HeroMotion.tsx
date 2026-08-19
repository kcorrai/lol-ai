"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Hero motion, split out so LandingHero itself stays a server component — the
 * splash is the LCP element and must not wait on a client bundle to render.
 *
 * On-load rather than on-scroll: the hero is already in view, so `whileInView`
 * would either fire instantly (pointless) or, worse, leave the headline hidden
 * if the observer were slow.
 */

const EASE = [0.16, 0.84, 0.44, 1] as const;

/** One line of the hero, entering in sequence. `step` is its place in the queue. */
export function HeroIntro({
  children,
  step,
}: {
  children: React.ReactNode;
  step: number;
}): React.ReactElement {
  const reduced = useReducedMotion();
  if (reduced) return <>{children}</>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.08 + step * 0.11, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * A single scan pass down the hero. `pointer-events-none` and `aria-hidden`
 * because it sits over the form — a decoration that ate a click on the Analyze
 * button would be worse than no decoration.
 */
export function HeroSweep(): React.ReactElement | null {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-[120px] bg-[linear-gradient(180deg,transparent,rgba(198,255,61,.07)_62%,rgba(198,255,61,.22))]"
      initial={{ y: "-120px", opacity: 0 }}
      animate={{ y: ["-120px", "660px"], opacity: [0, 1, 1, 0] }}
      transition={{ duration: 1.5, delay: 0.25, ease: "linear", times: [0, 0.12, 0.8, 1] }}
    />
  );
}
