import { cn } from "@/lib/utils";

interface MeterRowProps {
  label: string;
  /** The figure printed at the right of the label — already formatted. */
  value: string;
  /** 0–100. Clamped, because a share of a zero total is not a bar. */
  percent: number;
  tone?: "accent" | "muted" | "info";
  /** The thin variant the rail uses; the wide one is for the money panel. */
  compact?: boolean;
}

const BAR: Record<NonNullable<MeterRowProps["tone"]>, string> = {
  accent: "bg-accent",
  muted: "bg-ink-400",
  info: "bg-info",
};

/**
 * A labelled figure over a bar — how every proportion in this section is drawn.
 *
 * The bar is decoration for the number, never the other way round: the value is
 * always spelled out, so a meter that renders at 0 still says what it means.
 */
export function MeterRow({
  label,
  value,
  percent,
  tone = "accent",
  compact,
}: MeterRowProps): React.ReactElement {
  const width = Math.max(0, Math.min(100, percent));

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <span className={cn("text-text-muted", compact ? "text-[13px]" : "text-[13.5px]")}>
          {label}
        </span>
        <span
          className={cn(
            "font-mono",
            compact ? "text-xs" : "text-[13px]",
            tone === "muted" ? "text-text" : tone === "info" ? "text-info" : "text-accent"
          )}
        >
          {value}
        </span>
      </div>
      <span className={cn("block bg-surface-dark", compact ? "h-[3px]" : "h-1")}>
        <span className={cn("block h-full", BAR[tone])} style={{ width: `${width}%` }} />
      </span>
    </div>
  );
}
