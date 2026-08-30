import { cn } from "@/lib/cn";

export type MeterTone = "accent" | "danger" | "warning" | "info" | "neutral";

const FILLS: Record<MeterTone, string> = {
  accent: "bg-accent",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
  neutral: "bg-ink-400",
};

/**
 * A quantity as a length.
 *
 * It grows from nothing on arrival, which is the one thing a bar can do that a number
 * cannot: it says how big this is *relative to the track* before the reader has parsed the
 * figure beside it. Staggered by the caller, because only the caller knows its index in a
 * list.
 *
 * `aria-hidden` on the track: every meter on these screens sits beside the number it draws,
 * so announcing it a second time is noise. A meter that is ever the only statement of a
 * value must be given a label instead.
 */
export function Meter({
  value,
  tone = "accent",
  height = 4,
  delayMs = 0,
  className,
}: {
  /** 0–100. Clamped, because a percentage from a snapshot is not always one. */
  value: number;
  tone?: MeterTone;
  height?: number;
  delayMs?: number;
  className?: string;
}): React.ReactElement {
  const pct = Math.max(0, Math.min(100, value));

  return (
    <span aria-hidden className={cn("block w-full bg-surface-dark", className)} style={{ height }}>
      <span
        className={cn("hud-bar block h-full", FILLS[tone])}
        style={{ width: `${pct}%`, animationDelay: `${delayMs}ms` }}
      />
    </span>
  );
}
