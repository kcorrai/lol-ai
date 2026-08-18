"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useSetAcceptingStudents } from "@/hooks/useCoachProfile";

interface Props {
  accepting: boolean;
  /** A coach who is not approved has no books to open, so the switch is dead. */
  disabled?: boolean;
}

/**
 * The coach's own "taking students" switch.
 *
 * Optimistic, because the answer is a boolean the server cannot disagree with
 * on anything but permission — and if it does, the switch snaps back and says
 * so rather than leaving a coach believing they are closed when they are open.
 */
export function AcceptingStudentsToggle({ accepting, disabled }: Props): React.ReactElement {
  const [on, setOn] = useState(accepting);
  const [error, setError] = useState<string | null>(null);
  const mutation = useSetAcceptingStudents();

  function toggle(): void {
    const next = !on;
    setOn(next);
    setError(null);
    mutation.mutate(next, {
      onError: (err) => {
        setOn(!next);
        setError(err instanceof Error ? err.message : "Could not change that.");
      },
    });
  }

  return (
    <div className="text-right">
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Taking students"
        disabled={disabled || mutation.isPending}
        onClick={toggle}
        className="inline-flex items-center gap-2.5 disabled:opacity-50"
      >
        <span
          className={cn(
            "relative h-5 w-9 border transition-colors",
            on ? "border-accent bg-accent/25" : "border-line-2 bg-surface-dark"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-3.5 w-3.5 transition-all",
              on ? "left-[18px] bg-accent" : "left-0.5 bg-text-faint"
            )}
          />
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-text-muted">
          Taking students
        </span>
      </button>
      {error && <p className="mt-1.5 text-[11px] text-danger">{error}</p>}
    </div>
  );
}
