"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { SectionHead } from "./SectionHead";
import { ARSENAL, type ArsenalKey } from "./ArsenalPanels";

const ADVANCE_MS = 7000;

/**
 * The five things LaneIQ is, in one panel.
 *
 * The page used to explain exactly one of them — paste a Riot ID, get a report —
 * and left the Academy, the Draft Room, the esports hub and the streamer kit
 * undiscoverable to anyone who had not already signed up. Five separate bands
 * would have doubled the page; one panel that rotates through them costs a
 * screen and a half.
 *
 * Auto-advance is a courtesy for the reader who does not know there is anything
 * to click, so it stops the moment they show intent (hover, focus, or a click)
 * and never restarts — re-stealing the panel from someone who chose a tab is
 * the whole reason carousels are disliked.
 */
export function ArsenalTabs(): React.ReactElement {
  const [active, setActive] = useState<number>(0);
  const [auto, setAuto] = useState<boolean>(true);
  const reduced = useReducedMotion();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    if (!auto || reduced) return;
    const id = setInterval(() => setActive((i) => (i + 1) % ARSENAL.length), ADVANCE_MS);
    return () => clearInterval(id);
  }, [auto, reduced]);

  const pick = useCallback((index: number): void => {
    setAuto(false);
    setActive(index);
  }, []);

  function handleKey(e: React.KeyboardEvent<HTMLDivElement>): void {
    const delta =
      e.key === "ArrowDown" || e.key === "ArrowRight"
        ? 1
        : e.key === "ArrowUp" || e.key === "ArrowLeft"
          ? -1
          : 0;
    if (delta === 0) return;
    e.preventDefault();
    const next = (active + delta + ARSENAL.length) % ARSENAL.length;
    pick(next);
    tabRefs.current[next]?.focus();
  }

  const entry = ARSENAL[active];
  const Panel = entry.Panel;

  return (
    <section id="arsenal" className="px-5 pt-16 md:px-8 md:pt-[72px]">
      <div className="mx-auto max-w-[1240px]">
        <SectionHead title="One account, the whole stack" aside="Five ways in" />

        <div
          className="notch-lg grid grid-cols-1 overflow-hidden border border-border bg-surface lg:grid-cols-[300px_1fr]"
          onMouseEnter={() => setAuto(false)}
          onFocusCapture={() => setAuto(false)}
        >
          {/* Tab rail. A row of chips on phones, a stacked list from lg. */}
          <div
            role="tablist"
            aria-label="What LaneIQ does"
            aria-orientation="vertical"
            onKeyDown={handleKey}
            className="flex gap-px overflow-x-auto border-b border-border bg-line-1 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r"
          >
            {ARSENAL.map((item, i) => {
              const on = i === active;
              return (
                <button
                  key={item.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  role="tab"
                  id={`arsenal-tab-${item.key}`}
                  aria-selected={on}
                  aria-controls={`arsenal-panel-${item.key}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => pick(i)}
                  className={`relative shrink-0 bg-background px-5 py-4 text-left transition-colors duration-[160ms] ease-out lg:w-full ${
                    on ? "bg-surface-2" : "hover:bg-surface-2"
                  }`}
                >
                  {/* The accent is one 2px edge, not a filled tab — the system
                      spends its lime on the thing being sold, not the chrome. */}
                  <span
                    aria-hidden
                    className={`absolute left-0 top-0 h-full w-[2px] bg-accent transition-opacity duration-[160ms] ${on ? "opacity-100" : "opacity-0"}`}
                  />
                  <span className="flex items-baseline gap-2.5">
                    <span
                      className={`font-mono text-[10.5px] ${on ? "text-accent" : "text-text-faint"}`}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      className={`font-display text-[13px] font-bold uppercase tracking-[0.05em] ${on ? "text-text" : "text-text-muted"}`}
                    >
                      {item.title}
                    </span>
                  </span>
                  <span className="mt-1 hidden pl-[26px] text-[12px] text-text-muted lg:block">
                    {item.hint}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Panel */}
          <div
            role="tabpanel"
            id={`arsenal-panel-${entry.key}`}
            aria-labelledby={`arsenal-tab-${entry.key}`}
            className="relative min-h-[430px] bg-background p-6 md:p-8"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={entry.key}
                initial={reduced ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduced ? undefined : { opacity: 0, y: -8 }}
                transition={{ duration: 0.26, ease: [0.16, 0.84, 0.44, 1] }}
                className="grid gap-7 lg:grid-cols-[1fr_1.05fr] lg:items-start"
              >
                <div>
                  <span className="hud-label">{entry.kicker}</span>
                  <h3 className="mt-2.5 max-w-[20ch] font-display text-[22px] font-extrabold uppercase leading-[1.14] text-text md:text-[26px]">
                    {entry.headline}
                  </h3>
                  <p className="mt-3.5 max-w-[46ch] text-[15px] leading-relaxed text-text-body">
                    {entry.body}
                  </p>
                  <ul className="mt-5 grid gap-2">
                    {entry.points.map((p) => (
                      <li
                        key={p}
                        className="grid grid-cols-[14px_1fr] items-start gap-2.5 text-[13.5px] text-text-body"
                      >
                        <span aria-hidden className="mt-[7px] h-1.5 w-1.5 bg-accent" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={entry.href}
                    className="mt-6 inline-flex font-mono text-[11px] uppercase tracking-label text-accent"
                  >
                    {entry.cta} &rarr;
                  </Link>
                </div>

                <Panel />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export type { ArsenalKey };
