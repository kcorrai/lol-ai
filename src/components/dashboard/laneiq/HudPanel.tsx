interface HudPanelProps {
  children: React.ReactNode;
  className?: string;
}

/** Flat fill, 1px outline, chamfered corners, no shadow at rest (ADR-015). */
export function HudPanel({ children, className = "" }: HudPanelProps): React.ReactElement {
  return (
    <section className={`notch border border-border bg-surface ${className}`}>{children}</section>
  );
}

/** The `// SECTION` marker followed by a hairline that runs to the edge. */
export function HudRule({ label }: { label: string }): React.ReactElement {
  return (
    <div className="mt-1.5 flex items-center gap-3.5">
      <span className="hud-label">{label}</span>
      <span className="h-px flex-1 bg-line-1" />
    </div>
  );
}

export type MeterTone = "accent" | "info" | "warn" | "danger";

const TONE_FILL: Record<MeterTone, string> = {
  accent: "bg-accent",
  info: "bg-info",
  warn: "bg-warning",
  danger: "bg-danger",
};

interface HudMeterProps {
  value: number;
  label?: string;
  right?: string;
  tone?: MeterTone;
}

export function HudMeter({
  value,
  label,
  right,
  tone = "accent",
}: HudMeterProps): React.ReactElement {
  return (
    <div>
      {(label || right) && (
        <div className="mb-1.5 flex items-baseline justify-between gap-3">
          {label && <span className="text-[13px] text-text-body">{label}</span>}
          {right && <span className="font-mono text-[11.5px] text-text-muted">{right}</span>}
        </div>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-dark">
        <div
          className={`h-full rounded-full ${TONE_FILL[tone]}`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
}

interface StatBlockProps {
  label: string;
  value: string;
  unit?: string;
  delta?: string;
  deltaTone?: "good" | "bad" | "muted";
}

export function StatBlock({
  label,
  value,
  unit,
  delta,
  deltaTone = "muted",
}: StatBlockProps): React.ReactElement {
  const deltaColor =
    deltaTone === "good" ? "text-accent" : deltaTone === "bad" ? "text-danger" : "text-text-muted";
  return (
    <div>
      <p className="hud-label">{label}</p>
      <p className="mt-1 font-mono text-base font-bold text-text">
        {value}
        {unit && <span className="ml-1 text-[11px] font-normal text-text-muted">{unit}</span>}
      </p>
      {delta && <p className={`font-mono text-[10.5px] ${deltaColor}`}>{delta}</p>}
    </div>
  );
}
