import { cn } from "@/lib/utils";

export type ChipTone = "good" | "warn" | "bad" | "neutral" | "info";

const TONE: Record<ChipTone, string> = {
  good: "border-accent bg-accent/10 text-accent",
  warn: "border-warning bg-warning/15 text-warning",
  bad: "border-danger bg-danger/15 text-danger",
  info: "border-info bg-info/15 text-info",
  neutral: "border-line-2 bg-surface-dark text-text-muted",
};

interface StatusChipProps {
  tone?: ChipTone;
  /** A pulsing dot ahead of the label — for a state that is live right now. */
  pulse?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * The small cut-corner tag that carries a booking status, a badge or a count.
 *
 * Tone is the whole message here, so it is never softened: a status a coach has
 * to act on is amber wherever it appears in the section.
 */
export function StatusChip({
  tone = "neutral",
  pulse,
  className,
  children,
}: StatusChipProps): React.ReactElement {
  return (
    <span
      className={cn(
        "tag-cut inline-flex items-center gap-1.5 whitespace-nowrap border px-2 py-1",
        "font-mono text-[8.5px] font-bold uppercase tracking-[0.14em]",
        TONE[tone],
        className
      )}
    >
      {pulse && <span className="h-1.5 w-1.5 animate-pulse bg-current" aria-hidden />}
      {children}
    </span>
  );
}
