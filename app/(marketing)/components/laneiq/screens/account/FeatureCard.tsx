"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * One cell of the account band, and the panel that opens over it.
 *
 * The band names ten screens and shows none of them. Ten drawings side by side would be a
 * contact sheet — which is the reason the section had no pictures at all — but ten drawings
 * shown one at a time is not a contact sheet, it is a preview. That is what this is.
 *
 * **The grid never moves.** The panel is absolutely positioned and centred on the cell it
 * belongs to, so it opens *over* its neighbours rather than pushing them. A cell that expanded
 * in flow would shove every row beneath it down the page each time the pointer crossed a
 * border, and a section that jumps under the cursor is worse than one that stays quiet.
 *
 * ADR-052 is the written form of this: the landing page's motion budget allows a panel to open
 * on hover, and states the constraints kept here — no reflow, no spring, no bounce, nothing on
 * a pointer that cannot hover, and nothing at all under `prefers-reduced-motion` beyond the
 * finished state.
 */

const EASE = [0.16, 0.84, 0.44, 1] as const;

/**
 * True only where the pointer can actually hover.
 *
 * Read after mount, never during render: the server has no `matchMedia`, and a first paint
 * that depended on it would hydrate differently than it rendered. Starting at `false` also
 * means a touch device never opens a panel even for a frame — a tap there would otherwise land
 * on a preview instead of on the link the reader meant to follow.
 */
function useHoverPointer(): boolean {
  const [canHover, setCanHover] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover)");
    setCanHover(query.matches);
    const onChange = (e: MediaQueryListEvent): void => setCanHover(e.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  return canHover;
}

export interface FeatureCardProps {
  name: string;
  detail: string;
  href: string;
  /**
   * The screen this cell stands for, drawn — passed as an element, not as the component that
   * makes one. `AccountBand` is a server component and this is a client one, and a function
   * cannot cross that boundary: React refuses to serialise it. An element can, which also
   * means the ten drawings stay server-rendered and are already in the payload before the
   * first hover, so no panel opens onto a blank frame.
   */
  children: React.ReactNode;
}

export function FeatureCard({
  name,
  detail,
  href,
  children,
}: FeatureCardProps): React.ReactElement {
  const canHover = useHoverPointer();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);

  const show = canHover && open;

  return (
    <div
      className="relative h-full"
      onPointerEnter={(e) => {
        // Pointer type, not a media query: a stylus reports `hover: hover` on some tablets
        // while a finger on the same screen does not, and the enter event is the only place
        // that distinction is available.
        if (e.pointerType !== "touch") setOpen(true);
      }}
      onPointerLeave={() => setOpen(false)}
      // Keyboard reaches the same preview. The panel is decorative, so this is the only way
      // somebody tabbing the section gets to see what a screen looks like.
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <Link
        href={href}
        className="group relative flex h-full flex-col bg-background p-5 transition-colors duration-[160ms] ease-out hover:bg-surface-2"
      >
        {/* One accent edge on hover — the system's signature for a live card. */}
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-px bg-accent opacity-0 transition-opacity duration-[160ms] ease-out group-hover:opacity-100 motion-reduce:transition-none"
        />
        <p className="font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-text">
          {name}
        </p>
        <p className="mt-1.5 text-[13px] leading-relaxed text-text-muted">{detail}</p>
      </Link>

      <AnimatePresence>
        {show ? (
          <motion.div
            // Decorative twice over: the link underneath already announces the name and the
            // sentence, and `pointer-events-none` keeps the panel from becoming a target the
            // cursor could get stuck on. The link stays the only hit area in this cell.
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 z-30 w-[calc(100%+28px)] -translate-x-1/2 -translate-y-1/2"
            initial={reduced ? { opacity: 1 } : { opacity: 0, y: 6, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduced ? { opacity: 1 } : { opacity: 0, y: 4, scale: 0.99 }}
            transition={{ duration: reduced ? 0 : 0.2, ease: EASE }}
          >
            {/* `shadow` rather than the notch clip-path, which would cut the shadow away. The
                panel has to read as lifted off the grid it is covering, and the 1px accent
                outline alone does not do that over a cell of the same colour. */}
            <div className="notch border border-accent/50 bg-surface shadow-[0_18px_40px_rgba(0,0,0,0.55)]">
              <div className="border-b border-line-1 px-4 py-3">
                <p className="font-display text-[14px] font-extrabold uppercase tracking-[0.05em] text-text">
                  {name}
                </p>
                <p className="mt-1 text-[12px] leading-relaxed text-text-muted">{detail}</p>
              </div>
              {/* The instrument grid under the drawing, the same ground `ProductShowcase` and
                  the free-tools tiles give theirs — without it the drawn panel edges and the
                  card edge are one colour a pixel apart. */}
              <div className="p-3" style={{ background: "var(--bg-grid)" }}>
                {children}
              </div>
              {/* ADR-050: a picture of a product is read as a photograph of it unless
                  something says otherwise. One caption here rather than one inside each of the
                  ten marks — they all sit in this panel and nowhere else. */}
              <p className="hud-label border-t border-line-1 px-4 py-2">
                {"// Illustration — drawn, not a capture"}
              </p>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
