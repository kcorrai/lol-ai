interface ProgressRingProps {
  /** 0–1. Anything outside that is clamped rather than drawn wrong. */
  value: number;
  /** Rendered large in the middle — the count itself, already formatted. */
  children: React.ReactNode;
  /** The HUD caption under it. */
  label: string;
  /** Outer size in pixels. The stroke scales with it. */
  size?: number;
}

const RADIUS = 52;
const CIRCUMFERENCE = Math.round(2 * Math.PI * RADIUS);

/**
 * How much of the curriculum is behind the reader, as a ring rather than a bare fraction.
 *
 * The number is the thing being read, so it sits in the middle at full weight and the ring
 * is the gloss. Drawn from empty on mount — a progress meter that arrives already full
 * reads as decoration.
 */
export function ProgressRing({
  value,
  children,
  label,
  size = 196,
}: ProgressRingProps): React.ReactElement {
  const clamped = Math.max(0, Math.min(1, value));
  const offset = Math.round(CIRCUMFERENCE * (1 - clamped));

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--surface-inset)"
          strokeWidth="7"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--acid-500)"
          strokeWidth="7"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="butt"
          className="animate-academy-ring"
          style={{ "--ring-dash": CIRCUMFERENCE } as React.CSSProperties}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center gap-1">
        <span className="block font-mono text-[34px] font-bold tabular-nums leading-none text-text">
          {children}
        </span>
        <span className="hud-label text-text-faint">{label}</span>
      </span>
    </div>
  );
}
