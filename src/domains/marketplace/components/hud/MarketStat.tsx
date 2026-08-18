import { cn } from "@/lib/utils";

export type StatTone = "default" | "accent" | "warn" | "loss";

const TONE: Record<StatTone, string> = {
  default: "text-text",
  accent: "text-accent",
  warn: "text-warning",
  loss: "text-danger",
};

interface MarketStatProps {
  label: string;
  value: string;
  /** Written after the value, small — "request", "%", "unconfirmed". */
  unit?: string;
  /** A line of context under the figure. */
  note?: string;
  tone?: StatTone;
  className?: string;
}

/**
 * One readout in a HUD strip: a mono caption over a tabular figure.
 *
 * The value carries the tone rather than the caption, so a count that needs an
 * answer reads amber without turning its own label into an alarm.
 */
export function MarketStat({
  label,
  value,
  unit,
  note,
  tone = "default",
  className,
}: MarketStatProps): React.ReactElement {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 flex items-baseline gap-2">
        <span className={cn("font-mono text-[28px] font-bold leading-none", TONE[tone])}>
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-text-faint">
            {unit}
          </span>
        )}
      </p>
      {note && <p className="mt-2 text-[12.5px] text-text-muted">{note}</p>}
    </div>
  );
}
