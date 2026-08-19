"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef } from "react";

/**
 * The landing page's motion vocabulary, defined once.
 *
 * ADR-015 rations motion the same way it rations the accent: things fade, rise
 * and fill, but nothing grows and nothing bounces. Every primitive here returns
 * its children untouched under `prefers-reduced-motion` — the reduced-motion
 * reader gets the finished state, never a hidden or half-played one.
 */

const RISE = 22;
const DUR = 0.5;
const EASE = [0.16, 0.84, 0.44, 1] as const;

interface HudRevealProps {
  children: React.ReactNode;
  /** Position in a stagger group. Each step adds 70ms. */
  index?: number;
  /** Extra delay in seconds, added on top of the index stagger. */
  delay?: number;
  className?: string;
}

/** Fades and rises into view once. The workhorse — most sections use only this. */
export function HudReveal({
  children,
  index = 0,
  delay = 0,
  className,
}: HudRevealProps): React.ReactElement {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: RISE }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: DUR, delay: delay + index * 0.07, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Staggers a list of items without the caller having to thread an index through.
 * `as` exists because a stagger group is often a grid or a table body, and a
 * wrapper div would break the parent's grid.
 */
export function HudStagger({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}): React.ReactElement {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-70px" }}
      variants={{ shown: { transition: { staggerChildren: 0.07, delayChildren: delay } } }}
    >
      {children}
    </motion.div>
  );
}

/** One child of a HudStagger. Inherits the parent's timing rather than setting its own. */
export function HudStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;

  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: RISE },
        shown: { opacity: 1, y: 0, transition: { duration: DUR, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Returns true once the element has been scrolled into view, and stays true.
 * For components that need the fact rather than a wrapper element — a meter
 * animating its own width, say, where an extra div would break the layout.
 */
export function useEnteredView<T extends Element>(): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduced = useReducedMotion();
  return [ref, reduced ? true : inView];
}

/**
 * A 1px accent line that travels the top edge once when the section arrives.
 * The system's signature for "this panel is live" — used instead of a border
 * flash, which reads as a loading bar.
 */
export function EdgeSweep({ className = "" }: { className?: string }): React.ReactElement | null {
  const reduced = useReducedMotion();
  if (reduced) return null;

  return (
    <motion.span
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 top-0 h-px origin-left bg-gradient-to-r from-transparent via-accent to-transparent ${className}`}
      initial={{ scaleX: 0, opacity: 0 }}
      whileInView={{ scaleX: 1, opacity: [0, 1, 0.35] }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 1.1, ease: EASE }}
    />
  );
}
