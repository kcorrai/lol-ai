"use client";

interface SummaryRow {
  label: string;
  value: string;
  accent?: boolean;
}

interface PlanWindowSummaryProps {
  rows: SummaryRow[];
}

/**
 * The rail's read-out of the window the plan was measured over.
 *
 * Rows are passed in already resolved so the panel never has to decide what
 * counts as missing — a caller with no ranked data simply sends fewer rows.
 */
export function PlanWindowSummary({ rows }: PlanWindowSummaryProps): React.JSX.Element | null {
  if (rows.length === 0) return null;

  return (
    <section className="notch bg-hero-fade border border-border bg-surface px-4 py-4">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-label text-text-muted">
        {"// WINDOW SUMMARY"}
      </div>
      <div className="grid gap-2.5 text-[13px]">
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-2.5">
            <span className="text-fg-3">{row.label}</span>
            <span
              className={`font-mono text-xs tabular-nums ${row.accent ? "text-acid-500" : "text-fg-1"}`}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export type { SummaryRow };
