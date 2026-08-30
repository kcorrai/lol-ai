import { cn } from "@/lib/cn";

export type StatTone = "default" | "good" | "bad";

const TONES: Record<StatTone, string> = {
  default: "text-text",
  good: "text-accent",
  bad: "text-danger",
};

/**
 * One number with its name above it.
 *
 * Mono and tabular for the number, always: these sit in rows of three and four, and a
 * proportional digit makes a column of them look crooked. The label is the same mono at
 * label tracking, which is the design system's way of marking a caption as instrumentation
 * rather than prose.
 */
export function StatBlock({
  label,
  value,
  unit,
  note,
  tone = "default",
  size = "md",
  className,
}: {
  label: string;
  value: string;
  /** Set beside the value at a smaller size — a percent sign, never a second number. */
  unit?: string;
  /** One line under the value: what it is being compared against. */
  note?: React.ReactNode;
  tone?: StatTone;
  size?: "sm" | "md" | "lg";
  className?: string;
}): React.ReactElement {
  const scale = { sm: "text-xl", md: "text-[26px]", lg: "text-[30px]" }[size];

  return (
    <div className={cn("flex min-w-0 flex-col gap-1", className)}>
      <span className="hud-label truncate text-[10px]">{label}</span>
      <span className={cn("font-mono font-bold tabular-nums leading-none", scale, TONES[tone])}>
        {value}
        {unit ? <span className="ml-1 text-[0.42em] text-text-muted">{unit}</span> : null}
      </span>
      {note ? <span className="mt-0.5 truncate text-xs text-text-muted">{note}</span> : null}
    </div>
  );
}
