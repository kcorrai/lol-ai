"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Eye, Flame, Timer } from "lucide-react";

type Severity = "critical" | "warn" | "info";

const SEVERITY_STYLE: Record<Severity, { text: string; border: string }> = {
  critical: { text: "text-danger", border: "border-l-danger" },
  warn: { text: "text-warning", border: "border-l-warning" },
  info: { text: "text-info", border: "border-l-info" },
};

const SEVERITY_ICON = { critical: Eye, warn: Timer, info: Flame } as const;

export interface Insight {
  kicker: string;
  severity: Severity;
  headline: string;
  detail: string;
}

export function InsightCard({ kicker, severity, headline, detail }: Insight): React.ReactElement {
  const style = SEVERITY_STYLE[severity];
  const Icon = SEVERITY_ICON[severity];
  return (
    <div className={`border border-border ${style.border} border-l-2 bg-surface-dark p-3.5`}>
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${style.text}`} strokeWidth={1.75} />
        <span className={`font-mono text-[11px] uppercase tracking-label ${style.text}`}>
          {kicker}
        </span>
      </div>
      <p className="mt-2 text-sm font-semibold text-text">{headline}</p>
      <p className="mt-1 font-mono text-[11px] tracking-wide text-text-muted">{detail}</p>
    </div>
  );
}

export interface Grade {
  label: string;
  value: number;
  tone?: "accent" | "info" | "danger";
}

const TONE_FILL = {
  accent: "bg-accent",
  info: "bg-info",
  danger: "bg-danger",
} as const;

/**
 * The fill runs 0 → value when the meter scrolls into view, so a grade reads as a
 * measurement being taken rather than a bar that was always there. Under reduced
 * motion it renders at its final width with no transition.
 */
export function Meter({ label, value, tone = "accent" }: Grade): React.ReactElement {
  const reduced = useReducedMotion();

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-text-body">{label}</span>
        <span className="font-mono text-[13px] font-bold text-text">{value}</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-line-1">
        <motion.div
          className={`h-full rounded-full ${TONE_FILL[tone]}`}
          initial={reduced ? false : { width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.9, ease: [0.16, 0.84, 0.44, 1] }}
          style={reduced ? { width: `${value}%` } : undefined}
        />
      </div>
    </div>
  );
}

export interface Action {
  n: string;
  text: string;
  lp: string;
}

export function ActionRow({ n, text, lp }: Action): React.ReactElement {
  return (
    <div className="grid grid-cols-[26px_1fr_auto] items-center gap-3 border-b border-border pb-2.5">
      <span className="font-mono text-xs font-bold text-accent">{n}</span>
      <span className="text-sm text-text">{text}</span>
      <span className="whitespace-nowrap font-mono text-[11px] tracking-wider text-accent">
        {lp}
      </span>
    </div>
  );
}
