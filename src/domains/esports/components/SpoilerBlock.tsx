import { EyeOff } from "lucide-react";

/**
 * A stretch of a page that is the result itself — a game's scoreboard, gold
 * curve and final stats — held back in spoiler mode behind one button.
 *
 * Plain markup with no state of its own: the globals.css spoiler rules decide
 * which half shows, and SpoilerToggle's click handler opens it. That keeps it
 * usable from server and client components alike.
 */
export function SpoilerBlock({
  what,
  className = "",
  children,
}: {
  /** What is behind the button, e.g. "the scoreboard, gold curve and stats". */
  what: string;
  /** Spacing for the block when shown; the placeholder brings its own. */
  className?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <>
      <div data-spoiler-block="" className={className}>
        {children}
      </div>
      <div data-spoiler-placeholder="" className="gaming-card notch-sm mt-12 px-4 py-6 text-center">
        <EyeOff className="mx-auto h-5 w-5 text-text-muted" aria-hidden />
        <p className="mt-2 text-sm text-text-body">
          Scores are hidden. {what.charAt(0).toUpperCase() + what.slice(1)} would give the result
          away.
        </p>
        <button
          type="button"
          data-spoiler-reveal=""
          className="mt-3 border border-accent px-3 py-1.5 font-mono text-[11px] uppercase tracking-label text-accent transition-colors hover:bg-accent hover:text-background"
        >
          Show game results
        </button>
      </div>
    </>
  );
}
