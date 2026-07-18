"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { StepSearch, StepScan, StepReport, StepClimb } from "./ProductDemoSteps";

const STEPS = [
  { key: "search", label: "Enter your Riot ID", Comp: StepSearch },
  { key: "scan", label: "AI scans your matches", Comp: StepScan },
  { key: "report", label: "Get your report", Comp: StepReport },
  { key: "climb", label: "Climb", Comp: StepClimb },
] as const;

const INTERVAL_MS = 3000;

export function ProductDemo() {
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setActive((v) => (v + 1) % STEPS.length), INTERVAL_MS);
    return () => clearInterval(id);
  }, [reduced]);

  const Active = STEPS[active].Comp;

  return (
    <section className="relative overflow-hidden bg-surface/40 py-20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-accent/[0.03] to-transparent" />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-accent/70">See it in action</p>
          <h2 className="font-display text-3xl font-bold text-text md:text-4xl">From Riot ID to a climb plan</h2>
          <p className="mt-3 text-text-muted">Watch how one session turns into specific, personal coaching.</p>
        </div>

        {/* Screen */}
        <div className="relative mx-auto flex aspect-[16/10] w-full max-w-3xl items-center justify-center overflow-hidden rounded-2xl border border-border bg-background p-6 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={STEPS[active].key}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4 }}
              className="flex w-full items-center justify-center"
            >
              <Active />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Step tabs */}
        <div className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
          {STEPS.map((s, idx) => (
            <button
              key={s.key}
              onClick={() => setActive(idx)}
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors",
                idx === active
                  ? "border-accent/50 bg-accent/10 text-accent"
                  : "border-border bg-surface text-text-muted hover:text-text"
              )}
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold",
                  idx === active ? "bg-accent text-background" : "bg-surface-2 text-text-muted"
                )}
              >
                {idx + 1}
              </span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
