"use client";

import { useMemo, useState } from "react";
import type { CoachingReportDetail } from "@/types/coaching.frontend";

type Tone = "critical" | "warn" | "info" | "good";

interface Finding {
  key: string;
  severity: string;
  tone: Tone;
  title: string;
  body: string;
  cause: string;
  evidence: string;
}

const CHIP: Record<Tone, string> = {
  critical: "border-danger bg-danger/15 text-danger",
  warn: "border-warning bg-warning/15 text-warning",
  info: "border-info bg-info/15 text-info",
  good: "border-accent bg-accent/15 text-accent",
};

const EDGE: Record<Tone, string> = {
  critical: "border-l-danger",
  warn: "border-l-warning",
  info: "border-l-info",
  good: "border-l-accent",
};

const PRIORITY_TONE: Record<string, Tone> = { high: "critical", medium: "warn", low: "info" };
const PRIORITY_LABEL: Record<string, string> = { high: "Critical", medium: "High", low: "Medium" };

const TAG =
  "tag-cut border px-2.5 py-1 font-mono text-[10.5px] uppercase tracking-label transition-colors";
const FILTERS = ["All", "Problems", "Strengths"] as const;

/** Weaknesses and strengths as one ordered list, worst first, each with its evidence beside it. */
export function ReportFindings({ report }: { report: CoachingReportDetail }): React.ReactElement | null {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const findings = useMemo<Finding[]>(() => {
    const weaknesses: Finding[] = (report.weaknesses ?? []).map((w, i) => ({
      key: `w-${i}`,
      severity: PRIORITY_LABEL[w.priority] ?? w.priority,
      tone: PRIORITY_TONE[w.priority] ?? "info",
      title: w.area,
      body: w.description,
      cause: w.rootCause ? `Root cause · ${w.rootCause}` : "",
      evidence: w.evidence,
    }));
    const strengths: Finding[] = (report.strengths ?? []).map((s, i) => ({
      key: `s-${i}`,
      severity: "Strength",
      tone: "good",
      title: s.area,
      body: s.description,
      cause: "Keep doing this",
      evidence: s.evidence,
    }));
    // Problems before strengths, and inside the problems the model's own priority order.
    return [...weaknesses, ...strengths];
  }, [report.strengths, report.weaknesses]);

  if (findings.length === 0) return null;

  const shown = findings.filter(
    (f) =>
      filter === "All" ||
      (filter === "Problems" && f.tone !== "good") ||
      (filter === "Strengths" && f.tone === "good")
  );

  return (
    <section>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <span className="font-mono text-[11px] uppercase tracking-label text-text">Findings</span>
        <span className="hidden h-px flex-1 bg-line-1 sm:block" />
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`${TAG} ${
                f === filter
                  ? "border-accent bg-accent/15 text-accent"
                  : "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {shown.map((finding) => (
          <article
            key={finding.key}
            className={`notch border border-l-2 border-border bg-surface ${EDGE[finding.tone]}`}
          >
            <div className="grid lg:grid-cols-[minmax(0,1fr)_236px]">
              <div className="px-5 py-4">
                <div className="mb-2.5 flex flex-wrap items-center gap-2.5">
                  <span
                    className={`tag-cut border px-2 py-0.5 font-mono text-[9.5px] font-bold uppercase tracking-[0.16em] ${CHIP[finding.tone]}`}
                  >
                    {finding.severity}
                  </span>
                  <h3 className="font-display text-[17px] font-extrabold uppercase tracking-[0.03em] text-text">
                    {finding.title}
                  </h3>
                </div>
                <p className="max-w-[58ch] text-[14.5px] text-text-body">{finding.body}</p>
                {finding.cause && (
                  <p className="mt-2.5 font-mono text-[11px] tracking-[0.1em] text-text-body">
                    {finding.cause}
                  </p>
                )}
              </div>
              <div className="border-t border-line-1 bg-surface-dark px-5 py-4 lg:border-l lg:border-t-0">
                <p className="hud-label mb-2 text-[10px]">Evidence</p>
                <p className="text-[13px] text-text-body">{finding.evidence}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
