/**
 * The pieces the ten account-band previews are drawn from.
 *
 * They sit in a hover panel about 400px wide, which is more room than the free-tools tiles get
 * and less than the four `ProductShowcase` screens. `markParts.tsx` is still where a champion
 * plate, a draft slot and a signed delta live; this file holds only what those two do not
 * already cover.
 */

/** A label over a figure — the shape every stat block in the product has. */
export function Stat({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="min-w-0">
      <p className="truncate font-mono text-[8px] uppercase tracking-[0.14em] text-text-faint">
        {label}
      </p>
      <p className="mt-0.5 truncate font-mono text-[12px] font-bold tabular-nums text-text">
        {value}
      </p>
    </div>
  );
}

/** A row of `Stat`s ruled into cells, the way the product's KPI strips are. */
export function StatStrip({
  stats,
  columns,
}: {
  stats: readonly { label: string; value: string }[];
  columns: number;
}): React.ReactElement {
  return (
    <div
      className="grid gap-px border border-line-1 bg-line-1"
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {stats.map((s) => (
        <div key={s.label} className="bg-surface px-1.5 py-1.5">
          <Stat label={s.label} value={s.value} />
        </div>
      ))}
    </div>
  );
}

/** A filter or state chip. Outlined, never filled — the accent is rationed (ADR-015). */
export function Chip({
  children,
  on = false,
}: {
  children: React.ReactNode;
  on?: boolean;
}): React.ReactElement {
  return (
    <span
      className={`shrink-0 border px-1 py-px font-mono text-[7.5px] uppercase tracking-[0.1em] ${
        on ? "border-accent text-accent" : "border-line-1 text-text-faint"
      }`}
    >
      {children}
    </span>
  );
}
