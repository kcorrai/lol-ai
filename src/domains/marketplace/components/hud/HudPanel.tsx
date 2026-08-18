import { cn } from "@/lib/utils";

export type PanelTone = "default" | "warn" | "accent";

const TONE: Record<PanelTone, string> = {
  default: "border-border",
  warn: "border-warning shadow-[0_0_26px_rgba(255,194,75,0.10)]",
  accent: "border-accent/30",
};

interface HudPanelProps {
  /** The `// LABEL` that names the panel. Omitted means no header bar at all. */
  label?: string;
  /** Parked at the right of the header bar — a note, a link, a row of chips. */
  action?: React.ReactNode;
  tone?: PanelTone;
  /** Panels whose regions pad themselves pass `false`. */
  padded?: boolean;
  className?: string;
  children: React.ReactNode;
}

/**
 * The chamfered slab every panel in the coaching section is built on.
 *
 * The header bar is a rule with a mono tag rather than a heading, because these
 * panels sit inside a page that already has an h1 and a reader needs to scan
 * them as instruments, not as chapters.
 */
export function HudPanel({
  label,
  action,
  tone = "default",
  padded = true,
  className,
  children,
}: HudPanelProps): React.ReactElement {
  return (
    <section className={cn("notch border bg-surface", TONE[tone], className)}>
      {(label || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line-1 px-5 py-3.5">
          {label && (
            <span
              className={cn(
                "font-mono text-[10.5px] uppercase tracking-[0.18em]",
                tone === "warn" ? "text-warning" : "text-text-muted"
              )}
            >
              {`// ${label}`}
            </span>
          )}
          {action}
        </div>
      )}
      <div className={padded ? "p-5" : undefined}>{children}</div>
    </section>
  );
}
