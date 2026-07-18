"use client";

import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
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

// Step 2 — AI scans recent matches (realistic match history)
const SCAN_MATCHES = [
  { champ: "Yasuo", role: "Mid", win: true, k: 14, d: 3, a: 9, cs: 251 },
  { champ: "Ahri", role: "Mid", win: true, k: 9, d: 2, a: 16, cs: 214 },
  { champ: "Zed", role: "Mid", win: false, k: 7, d: 8, a: 5, cs: 223 },
  { champ: "LeeSin", role: "Jungle", win: true, k: 8, d: 4, a: 18, cs: 168 },
];

export function StepScan() {
  return (
    <div className="w-full max-w-md">
      <div className="mb-3 flex items-center gap-2 text-sm font-medium text-text">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        Analyzing your last 20 ranked matches…
      </div>
      <div className="space-y-1.5">
        {SCAN_MATCHES.map((m, i) => {
          const kda = ((m.k + m.a) / Math.max(m.d, 1)).toFixed(1);
          return (
            <motion.div
              key={m.champ}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: i * 0.18 }}
              className={`flex items-center gap-2.5 rounded-lg border bg-surface p-2 ${m.win ? "border-l-2 border-l-success" : "border-l-2 border-l-danger"} border-border`}
            >
              <ChampionIcon name={m.champ} size={30} className="rounded-md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-text">{m.champ}</p>
                <p className="text-[10px] text-text-muted">{m.role}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-text">{m.k}/{m.d}/{m.a}</p>
                <p className="text-[10px] text-text-muted">{kda} KDA · {m.cs} CS</p>
              </div>
              <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${m.win ? "bg-success/15 text-success" : "bg-danger/15 text-danger"}`}>
                {m.win ? "WIN" : "LOSS"}
              </span>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
        <motion.div
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2.4, ease: "easeInOut" }}
          className="h-full bg-accent"
        />
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
