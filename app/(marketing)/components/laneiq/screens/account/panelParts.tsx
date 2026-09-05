/**
 * The pieces the ten account-band drawings are built from.
 *
 * They sit between the two vocabularies that already exist. `screenChrome.tsx` draws a whole
 * browser window and is too big for a hover panel; `markParts.tsx` draws a 340x110 tile and is
 * too small to carry a screen's own column headers. These are for the size in between — about
 * 360x150 — where a stat label still fits next to its figure.
 *
 * Nothing here invents a shape. Every one of these is a piece of furniture that appears on the
 * screens being drawn: a labelled stat cell, a metric tab row, a labelled bar, a summary rule.
 */

/** A labelled figure in its own cell. The shape every stat strip in the product uses. */
export function Cell({
  label,
  value,
  tone = "text",
}: {
  label: string;
  value: string;
  tone?: "text" | "accent" | "danger";
}): React.ReactElement {
  const fill = { text: "text-text", accent: "text-accent", danger: "text-danger" }[tone];
  return (
    <div className="min-w-0 bg-surface px-1.5 py-1.5">
      <p className="truncate font-mono text-[7.5px] uppercase tracking-[0.12em] text-text-faint">
        {label}
      </p>
      <p className={`mt-0.5 truncate font-mono text-[11px] font-bold tabular-nums ${fill}`}>
        {value}
      </p>
    </div>
  );
}

/** A named quantity as a bar plus its figure — a target, a share, a count out of a total. */
export function StatRow({
  label,
  value,
  fill,
  tone = "text",
}: {
  label: string;
  value: string;
  /** 0-100. */
  fill: number;
  tone?: "text" | "accent" | "danger";
}): React.ReactElement {
  const bar = { text: "bg-ink-400", accent: "bg-accent", danger: "bg-danger" }[tone];
  const text = { text: "text-text-body", accent: "text-accent", danger: "text-danger" }[tone];
  return (
    <div className="flex items-center gap-2">
      <span className="w-[74px] shrink-0 truncate font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-faint">
        {label}
      </span>
      <span className="block h-[3px] min-w-0 flex-1 bg-surface-dark">
        <span
          className={`block h-full ${bar}`}
          style={{ width: `${Math.max(0, Math.min(100, fill))}%` }}
        />
      </span>
      <span className={`shrink-0 font-mono text-[9.5px] tabular-nums ${text}`}>{value}</span>
    </div>
  );
}

/**
 * A row of tabs with one selected.
 *
 * Four of these screens are one dataset seen through a chooser — the metric on the improvement
 * chart, the month on the milestone, the period on the leaderboard — and drawing the chooser is
 * what separates them from a static readout.
 */
export function Tabs({
  items,
  active,
}: {
  items: readonly string[];
  active: string;
}): React.ReactElement {
  return (
    <span className="flex gap-1">
      {items.map((item) => (
        <span
          key={item}
          className={`border px-1 py-px font-mono text-[7.5px] uppercase tracking-[0.1em] ${
            item === active ? "border-accent text-accent" : "border-line-1 text-text-faint"
          }`}
        >
          {item}
        </span>
      ))}
    </span>
  );
}

/** The one figure a drawing is allowed to shout. Rationed the way the accent is (ADR-015). */
export function Figure({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <span className="shrink-0 font-display text-[15px] font-extrabold tabular-nums leading-none text-accent">
      {children}
    </span>
  );
}

/** A summary line under a section — the sentence a band or a window closes on. */
export function Rule({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <p className="truncate border-t border-line-1 pt-1.5 font-mono text-[8.5px] uppercase tracking-[0.12em] text-text-faint">
      {children}
    </p>
  );
}
