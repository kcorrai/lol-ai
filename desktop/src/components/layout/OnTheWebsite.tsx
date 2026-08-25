import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { HudPanel } from "@/components/layout/HudPanel";
import { cn } from "@/lib/cn";
import { openOnWebsite, WebsiteError } from "@/lib/website";

/**
 * What a screen the companion does not cover looks like (ADR-044).
 *
 * This used to be a sentence and nothing else — "That screen is not in the desktop app yet.
 * Open it on the website." — with no way to open it. A dead end, and reachable by an
 * ordinary click on any link a lifted screen draws to the rest of the site.
 *
 * It is a handoff now rather than an apology, because under ADR-044 most of the site is
 * meant to stay on the site. "Yet" is gone from the copy for the same reason: this is where
 * these pages live, not a gap waiting to be filled.
 */
export function OnTheWebsite({ path }: { path: string }): React.ReactElement {
  const [error, setError] = useState<string | null>(null);

  async function open(): Promise<void> {
    setError(null);
    try {
      await openOnWebsite(path);
    } catch (err) {
      setError(err instanceof WebsiteError ? err.message : "Could not open your browser.");
    }
  }

  return (
    <HudPanel title="On the website">
      <p className="text-sm text-text-muted">
        This page lives on the website. The companion keeps the screens worth having next to a
        running game; the rest opens in your browser, where you are already signed in.
      </p>

      <p className="mt-3 break-all font-mono text-[12px] text-text-faint">{path}</p>

      <button
        type="button"
        onClick={open}
        className={cn(
          "tag-cut mt-4 inline-flex items-center gap-2 px-4 py-2",
          "font-mono text-[11px] font-bold uppercase tracking-label",
          "bg-accent text-background transition-opacity hover:opacity-90"
        )}
      >
        Open on the website
        <ExternalLink className="h-3 w-3" aria-hidden />
      </button>

      {error ? (
        <p role="alert" className="mt-3 text-[12px] text-danger">
          {error}
        </p>
      ) : null}
    </HudPanel>
  );
}
