"use client";

import { useEffect, useState } from "react";
import { nextResetAt } from "@/domains/quiz/services/dailySeed";

// A visible countdown is the one piece of daily-puzzle furniture the research
// found players respond to and LoLdle does not show: it turns "come back
// sometime" into "come back at a time".

function remaining(target: string): string {
  const ms = new Date(target).getTime() - Date.now();
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  return parts.map((p) => String(p).padStart(2, "0")).join(":");
}

/**
 * The bare clock — callers supply their own label and typography around it.
 * `nextResetAt` is optional: with nothing passed it works the next UTC midnight
 * out for itself, which is all any caller outside the quiz page needs.
 */
export function ResetCountdown({
  nextResetAt: target,
}: {
  nextResetAt?: string;
}): React.JSX.Element {
  // Rendered empty on the server: the value depends on the viewer's clock, and
  // shipping the server's would guarantee a hydration mismatch every time.
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    const at = target ?? nextResetAt(new Date()).toISOString();
    setLabel(remaining(at));
    const timer = setInterval(() => setLabel(remaining(at)), 1000);
    return () => clearInterval(timer);
  }, [target]);

  return <span className="tabular-nums">{label ?? "--:--:--"}</span>;
}
