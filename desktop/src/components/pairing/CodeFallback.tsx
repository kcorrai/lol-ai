import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { CodeEntry } from "./CodeEntry";
import { cn } from "@/lib/cn";

/**
 * The pairing code, kept and demoted (ADR-048).
 *
 * The fast path assumes the browser this app can open is the one the player is signed in
 * on. That is true almost always and not always: a work machine with a locked-down
 * default browser, a second profile, an account they are only signed in to on a phone.
 * For those the code still works, and it is the only thing that does — so it stays, and
 * it stays closed, because a screen that offers two ways of doing one thing has asked the
 * player to make a decision they have no way to make.
 */
export function CodeFallback({
  onSubmit,
  busy,
  error,
}: {
  onSubmit: (code: string) => Promise<void>;
  busy: boolean;
  error: string | null;
}): React.ReactElement {
  // Opened for them when a code exchange is what just failed: the panel that holds the
  // error must not be the one that is shut.
  const [open, setOpen] = useState(() => error !== null);

  return (
    <div className="border-t border-line-1 pt-3">
      <button
        type="button"
        onClick={() => setOpen((was) => !was)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 text-left font-mono text-[10px] font-bold uppercase tracking-label text-text-muted transition-colors hover:text-accent"
      >
        <ChevronDown
          className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-180")}
          aria-hidden
        />
        Sign in on another device instead
      </button>

      {open && (
        <div className="mt-3 grid gap-3">
          <p className="text-xs text-text-muted">
            Use this if the browser on this computer is not the one you are signed in on.
            Open Settings → Desktop app there, generate a code, and type it here.
          </p>
          <CodeEntry onSubmit={onSubmit} busy={busy} disabled={false} error={error} />
        </div>
      )}
    </div>
  );
}
