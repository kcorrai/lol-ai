import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The panel, verbatim from the website's `HudPanel` (ADR-015): flat fill, one-pixel
 * outline, chamfered top-left and bottom-right, no shadow. Elevation is read from border
 * brightness, never from blur.
 */
export function HudPanel({
  title,
  action,
  children,
  /**
   * Drops the body padding. For the panels whose content is a full-bleed grid — a
   * two-column split with a rule down the middle, a scoreboard, a list of rows — where the
   * padding belongs to each cell and putting it here as well insets the rule.
   */
  bare,
  /**
   * `accent` is the panel that has just changed: an accent outline and a soft glow, for the
   * game-over banner and nothing else. Rationed on purpose — a screen where several panels
   * glow is a screen where none of them mean anything (ADR-015).
   */
  tone = "default",
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  bare?: boolean;
  tone?: "default" | "accent";
  className?: string;
}): React.ReactElement {
  return (
    <section
      className={cn(
        "notch bg-surface",
        tone === "accent" ? "glow-accent-soft border border-accent" : "border border-border",
        className
      )}
    >
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-line-1 px-4 py-2.5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text">
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      <div className={bare ? undefined : "p-4"}>{children}</div>
    </section>
  );
}

/**
 * The line a panel header carries on its right: a sample size, a patch, a matchup.
 *
 * Always mono and always muted, because it is the caveat rather than the reading — the
 * number it qualifies is in the panel body at four times the size. Truncating rather than
 * wrapping keeps the header one row tall whatever it is given.
 */
export function PanelMeta({ children }: { children: ReactNode }): React.ReactElement {
  return (
    <p className="truncate font-mono text-[10px] uppercase tracking-[0.16em] text-text-faint">
      {children}
    </p>
  );
}
