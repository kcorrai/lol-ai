"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { DEMO_FINAL, DEMO_STEPS, demoFrame, type DemoFrame } from "./heroDemoTimeline";

const TICK_MS = 90;

/**
 * The hero's promise, played out: a Riot ID goes in, the games are read, one habit comes out.
 *
 * A visitor was asked to paste their ID before seeing what that does; the sample report that
 * answers it is a scroll away. This shows the round trip beside the form, in the same words
 * the form itself uses while it works, and the verdict is the sample report's.
 *
 * Wide screens only. On a phone the form is the whole first screen and the sample report
 * follows it directly, so this would only push the report further down.
 *
 * Decorative to assistive tech: the form beside it is the real control, and a region that
 * rewrote itself every ninety milliseconds would be noise to a screen reader.
 */
export function HeroDemo(): React.ReactElement {
  const reduced = useReducedMotion();
  const [frame, setFrame] = useState<DemoFrame>(DEMO_FINAL);

  useEffect(() => {
    if (reduced) {
      setFrame(DEMO_FINAL);
      return;
    }
    const start = Date.now();
    setFrame(demoFrame(0));
    const id = setInterval(() => setFrame(demoFrame(Date.now() - start)), TICK_MS);
    return () => clearInterval(id);
  }, [reduced]);

  const analyzing = frame.step !== null;

  return (
    <div
      aria-hidden
      className="notch-lg hidden w-[380px] shrink-0 border border-border bg-[var(--surface-glass)] p-5 backdrop-blur-[10px] lg:block"
    >
      <div className="flex items-center justify-between">
        <span className="hud-label">{"// Example"}</span>
        <span className="font-mono text-[10px] uppercase tracking-label text-text-faint">
          ~90s, sped up
        </span>
      </div>

      <div className="mt-3.5 flex h-10 items-center border border-line-2 bg-background px-3 font-mono text-[13px] text-text">
        {frame.typed}
        {!analyzing && !frame.done ? (
          <span className="ml-px inline-block h-4 w-[7px] animate-pulse bg-accent" />
        ) : null}
      </div>

      <ul className="mt-3.5 grid gap-1.5">
        {DEMO_STEPS.map((label, i) => {
          const reached = frame.done || (analyzing && i <= (frame.step ?? -1));
          const current = analyzing && i === frame.step;
          return (
            <li
              key={label}
              className={`font-mono text-[11px] uppercase tracking-label transition-colors duration-200 ${
                current ? "text-accent" : reached ? "text-text-muted" : "text-text-faint opacity-50"
              }`}
            >
              {reached && !current ? "✓ " : "· "}
              {label}
            </li>
          );
        })}
      </ul>

      <div
        className={`mt-4 border-t border-border pt-4 transition-opacity duration-300 ${
          frame.done ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <ChampionIcon name="Viego" size={28} />
          <span className="font-mono text-[11px] uppercase tracking-label text-accent">
            {"// Fix this first"}
          </span>
        </div>
        <p className="mt-2.5 font-display text-[15px] font-bold uppercase leading-snug text-text">
          You lose the 20 seconds after full clear.
        </p>
        <p className="mt-1.5 font-mono text-[11px] text-text-muted">
          No vision before the river · 11 deaths
        </p>
      </div>
    </div>
  );
}
