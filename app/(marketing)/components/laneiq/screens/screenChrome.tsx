/**
 * The pieces the four web-app illustrations are drawn from.
 *
 * The landing page used to photograph these screens. A 1440px capture shown at 400px is
 * unreadable, and the tier list carried its patch number in the pixels, so every shot was
 * wrong within a fortnight — ADR-050 has the whole argument. These are drawings instead, in
 * the same language `ArsenalVisuals.tsx` and `desktop/OverlayVisual.tsx` already use.
 *
 * `Window` is the piece that fixes the specific thing that made the photographs look broken:
 * the capture included the app's own top bar, so a wordmark and a player-search field landed
 * directly under the marketing header's wordmark and player-search field, and the picture
 * read as the page having embedded itself. What a reader needs is a boundary saying "this is
 * a screen", not a reproduction of a navigation bar they are already looking at — so the
 * chrome here is one thin strip with a name on it and nothing that can be mistaken for the
 * site's own furniture.
 *
 * Everything is presentational and server-rendered. The sections that place these supply the
 * entrance animation.
 */

/** A quantity as a length. Fixed, never animated — see `desktop/chrome.tsx`'s `Bar`. */
export function Track({
  value,
  tone = "accent",
  className,
}: {
  /** 0–100. */
  value: number;
  tone?: "accent" | "danger" | "warning" | "info";
  className?: string;
}): React.ReactElement {
  const fill = {
    accent: "bg-accent",
    danger: "bg-danger",
    warning: "bg-warning",
    info: "bg-info",
  }[tone];
  return (
    <span className={`block w-full bg-surface-dark ${className ?? ""}`} style={{ height: 3 }}>
      <span
        className={`block h-full ${fill}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </span>
  );
}

/**
 * The frame a drawn screen sits in.
 *
 * `name` is what the screen is, not who makes it. Writing "LoL AI Coach" here would put the
 * product's wordmark on the page twice and reintroduce the confusion described above.
 */
export function Window({
  name,
  meta,
  children,
  className,
}: {
  name: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={`notch-lg relative overflow-hidden border border-border bg-ink-1000 ${
        className ?? ""
      }`}
    >
      <div className="flex items-center justify-between gap-3 border-b border-line-1 bg-ink-700 px-3.5 py-2">
        <div className="flex min-w-0 items-center gap-2">
          {/* Three ticks, not three dots: a traffic-light cluster reads as macOS, and the
              product this draws is a web page in whatever browser the reader already has. */}
          <span aria-hidden className="flex shrink-0 gap-1">
            <span className="block h-2.5 w-px bg-ink-400" />
            <span className="block h-2.5 w-px bg-ink-400" />
            <span className="block h-2.5 w-px bg-ink-400" />
          </span>
          <span className="truncate font-mono text-[9.5px] uppercase tracking-[0.18em] text-text-muted">
            {name}
          </span>
        </div>
        {meta ? (
          <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[0.16em] text-text-faint">
            {meta}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

export interface RailGroup {
  group: string;
  items: readonly string[];
}

/**
 * The app's left navigation, read off `src/components/layout/navConfig.ts`.
 *
 * Not all of it: that file has eleven groups and this is a picture. It stops after the group
 * that carries the argument, and `current` marks where the drawn body belongs so the two
 * halves of the illustration agree with each other.
 */
export function Rail({
  groups,
  current,
  className,
}: {
  groups: readonly RailGroup[];
  current: string;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`border-r border-line-1 bg-ink-700 py-3 ${className ?? ""}`}>
      {groups.map((g) => (
        <div key={g.group} className="mb-3 last:mb-0">
          <p className="px-3.5 pb-1.5 font-mono text-[8.5px] uppercase tracking-[0.18em] text-text-faint">
            {g.group}
          </p>
          {g.items.map((item) => {
            const active = item === current;
            return (
              <p
                key={item}
                className={`truncate border-l-2 px-3 py-[5px] text-[11px] ${
                  active
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-transparent text-text-muted"
                }`}
              >
                {item}
              </p>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/**
 * A panel inside a drawn screen.
 *
 * The `// label` header is the app's own convention — `HudRule` and the dashboard's columns
 * both title themselves that way — so reproducing it is what makes these read as that product
 * rather than as generic dashboard furniture.
 */
export function Card({
  label,
  meta,
  children,
  className,
}: {
  label: string;
  meta?: string;
  children: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div className={`notch-sm border border-line-1 bg-surface p-3 ${className ?? ""}`}>
      <div className="mb-2.5 flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate font-mono text-[9.5px] uppercase tracking-[0.14em] text-text-muted">
          {`// ${label}`}
        </p>
        {meta ? (
          <p className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-text-faint">
            {meta}
          </p>
        ) : null}
      </div>
      {children}
    </div>
  );
}

const BADGE: Record<string, string> = {
  S: "border-warning text-warning",
  A: "border-accent text-accent",
  B: "border-info text-info",
};

/** The letter tier badge `TierTable` puts at the head of each band. */
export function TierBadge({ tier }: { tier: string }): React.ReactElement {
  return (
    <span
      className={`inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center border font-mono text-[10px] font-bold ${
        BADGE[tier] ?? "border-line-1 text-text-muted"
      }`}
    >
      {tier}
    </span>
  );
}

/** A champion's stand-in portrait. Never real art: it would need a network round trip. */
export function Portrait({ size = 18 }: { size?: number }): React.ReactElement {
  return (
    <span
      aria-hidden
      className="block shrink-0 border border-line-1 bg-surface-2"
      style={{ width: size, height: size }}
    />
  );
}
