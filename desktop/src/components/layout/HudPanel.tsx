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
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <section className={cn("notch border border-border bg-surface", className)}>
      {title ? (
        <header className="flex items-center justify-between gap-3 border-b border-line-1 px-4 py-2.5">
          <h2 className="font-display text-sm font-bold uppercase tracking-[0.08em] text-text">
            {title}
          </h2>
          {action}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  );
}
