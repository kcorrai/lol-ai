/**
 * The pieces the desktop illustrations are drawn from.
 *
 * Drawn, and not photographed. There is no signed release to screenshot, and
 * `scripts/captureScreenshots.ts` records the standing rule for the screens a shot cannot
 * reach honestly — they "keep their drawn illustrations". These follow the same route
 * `ArsenalVisuals.tsx` and `ArsenalBoards.tsx` already take for the web product.
 *
 * `Panel` is `desktop/src/components/layout/HudPanel.tsx` reproduced in marketing tokens:
 * flat fill, one-pixel outline, chamfered corners, a header rule, a mono caveat on the right.
 * Reproduced rather than imported, because the two applications do not share a bundle — so
 * the comment above each drawing names the file it was copied from, and that is the only
 * thing keeping them in step.
 *
 * Everything here is presentational and server-rendered: no state, no motion, no client
 * bundle. The sections that place these supply the entrance animation.
 */

/**
 * The frame every illustration sits in, and the label that says it is one.
 *
 * The numbers inside these drawings are made up, and a picture of a product is read as a
 * photograph of it unless something says otherwise. The caption is that something. The
 * drawing itself is `aria-hidden` under a single `role="img"`: read aloud, a grid of
 * invented CS totals is noise, and the prose beside every one of these already makes the
 * claim the picture is illustrating.
 */
export function Illustration({
  label,
  caption,
  children,
  className,
}: {
  /** What the picture shows, for anyone who cannot see it. */
  label: string;
  caption: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <figure className={className}>
      <div role="img" aria-label={label}>
        <div aria-hidden>{children}</div>
      </div>
      <figcaption className="hud-label mt-2.5 block">{caption}</figcaption>
    </figure>
  );
}

/** `HudPanel`: title on the left, a mono caveat on the right, a rule under both. */
export function Panel({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section className={`notch border border-border bg-surface ${className ?? ""}`}>
      <header className="flex min-w-0 items-center justify-between gap-3 border-b border-line-1 px-3.5 py-2">
        <h3 className="shrink-0 font-display text-[11.5px] font-bold uppercase tracking-[0.08em] text-text">
          {title}
        </h3>
        {meta ? (
          <p className="min-w-0 truncate font-mono text-[9.5px] uppercase tracking-[0.16em] text-text-faint">
            {meta}
          </p>
        ) : null}
      </header>
      <div className="p-3.5">{children}</div>
    </section>
  );
}

export type Tone = "accent" | "danger" | "warning" | "info" | "neutral";

const FILL: Record<Tone, string> = {
  accent: "bg-accent",
  danger: "bg-danger",
  warning: "bg-warning",
  info: "bg-info",
  neutral: "bg-ink-400",
};

const TEXT: Record<Tone, string> = {
  accent: "text-accent",
  danger: "text-danger",
  warning: "text-warning",
  info: "text-info",
  neutral: "text-text-body",
};

// Written out rather than composed as `border-${tone}/30`: Tailwind reads class names as
// literals, so an interpolated one is a class that never reaches the stylesheet.
const EDGE: Record<Tone, string> = {
  accent: "border-accent/30",
  danger: "border-danger/30",
  warning: "border-warning/30",
  info: "border-info/30",
  neutral: "border-line-1",
};

/**
 * A quantity as a length, on the fixed track `desktop/src/components/hud/Meter.tsx` draws.
 *
 * Fixed, and not animated: these are illustrations of a running application, and a bar that
 * grew on scroll would be the marketing page performing rather than the product working.
 */
export function Bar({
  value,
  tone = "accent",
  className,
}: {
  /** 0–100. */
  value: number;
  tone?: Tone;
  className?: string;
}): React.ReactElement {
  return (
    <span className={`block w-full bg-surface-dark ${className ?? ""}`} style={{ height: 3 }}>
      <span
        className={`block h-full ${FILL[tone]}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}

/** A reading: what it is, what it says, and how it compares. */
export function Stat({
  label,
  value,
  note,
  bar,
  tone = "accent",
}: {
  label: string;
  value: string;
  note?: string;
  bar?: number;
  tone?: Tone;
}): React.ReactElement {
  return (
    <div className="min-w-0">
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-faint">
          {label}
        </span>
        <span className={`font-mono text-[12px] font-bold tabular-nums ${TEXT[tone]}`}>
          {value}
        </span>
      </div>
      {bar === undefined ? null : <Bar value={bar} tone={tone} className="mt-1.5" />}
      {note ? <p className="mt-1 text-[10.5px] leading-tight text-text-muted">{note}</p> : null}
    </div>
  );
}

/** The small outlined tag the app uses for a shortcut, a patch or a connection state. */
export function Chip({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: Tone;
}): React.ReactElement {
  const accented = tone !== "neutral";
  return (
    <span
      className={`inline-flex items-center gap-1.5 border px-2 py-[3px] font-mono text-[9.5px] uppercase tracking-[0.14em] ${
        EDGE[tone]
      } ${accented ? TEXT[tone] : "text-text-faint"}`}
    >
      {accented ? <span className={`h-1.5 w-1.5 ${FILL[tone]}`} /> : null}
      {children}
    </span>
  );
}
