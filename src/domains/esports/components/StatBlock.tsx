export type StatTone = "default" | "accent" | "warn" | "loss";

const TONE: Record<StatTone, string> = {
  default: "text-text",
  accent: "text-accent",
  warn: "text-warning",
  loss: "text-danger",
};

interface StatBlockProps {
  label: string;
  value: string;
  /** Written after the value, small — "series", "of 10", "%". */
  unit?: string;
  tone?: StatTone;
}

/**
 * One readout in a HUD strip: a mono label over a tabular figure.
 *
 * The value carries the tone rather than the label, so a losing record reads red
 * without turning its own caption into an alarm.
 */
export function StatBlock({
  label,
  value,
  unit,
  tone = "default",
}: StatBlockProps): React.ReactElement {
  return (
    <div className="min-w-0">
      <p className="hud-label truncate">{label}</p>
      <p className="mt-1.5 flex items-baseline gap-2">
        <span className={`font-mono text-2xl font-bold leading-none ${TONE[tone]}`}>{value}</span>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-label text-text-faint">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}
