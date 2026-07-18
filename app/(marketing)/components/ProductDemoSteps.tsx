"use client";

import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { ReportPreview } from "./FeaturePreviews";

// Step 1 — enter your Riot ID
export function StepSearch() {
  return (
    <div className="w-full max-w-md">
      <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-accent">Analyze your account</p>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2">
        <Search className="ml-1 h-4 w-4 shrink-0 text-text-muted" />
        <span className="flex-1 text-sm text-text">
          Faker#KR1<span className="ml-0.5 inline-block h-4 w-px animate-pulse bg-accent align-middle" />
        </span>
        <span className="rounded-md border border-border bg-background px-2 py-1 text-xs text-text-muted">KR</span>
        <span className="rounded-md bg-accent px-3 py-1.5 text-xs font-semibold text-background">Analyze</span>
      </div>
      <p className="mt-3 text-center text-xs text-text-muted">No login · results in seconds</p>
    </div>
  );
}

// Step 2 — AI scans recent matches
export function StepScan() {
  const rows = [
    { c: "#52B788", w: "68%" },
    { c: "#E63946", w: "82%" },
    { c: "#C89B3C", w: "74%" },
    { c: "#52B788", w: "60%" },
  ];
  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center justify-center gap-2 text-sm text-text">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        Analyzing your last 20 ranked matches…
      </div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2">
            <span className="h-7 w-7 shrink-0 rounded-md" style={{ background: r.c }} />
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: r.w }}
              transition={{ duration: 1, delay: i * 0.15 }}
              className="h-2 rounded-full bg-accent/40"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 3 — the coaching report (reuse the real product mock)
export function StepReport() {
  return (
    <div className="w-full max-w-sm">
      <ReportPreview />
    </div>
  );
}

// Step 4 — LP climb
export function StepClimb() {
  const bars = [38, 52, 47, 63, 71, 84, 92];
  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-text">Ranked climb</span>
        <span className="text-success">Silver II → Gold IV · +180 LP</span>
      </div>
      <div className="flex h-40 items-end gap-2 rounded-xl border border-border bg-surface p-4">
        {bars.map((h, i) => (
          <motion.div
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ duration: 0.8, delay: i * 0.08 }}
            className="flex-1 rounded-t bg-gradient-to-t from-accent/40 to-accent"
          />
        ))}
      </div>
    </div>
  );
}
