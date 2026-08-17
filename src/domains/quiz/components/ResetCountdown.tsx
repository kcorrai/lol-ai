"use client";

import { useEffect, useState } from "react";

// A visible countdown is the one piece of daily-puzzle furniture the research
// found players respond to and LoLdle does not show: it turns "come back
// sometime" into "come back at a time".

function remaining(nextResetAt: string): string {
  const ms = new Date(nextResetAt).getTime() - Date.now();
  if (ms <= 0) return "00:00:00";
  const total = Math.floor(ms / 1000);
  const parts = [Math.floor(total / 3600), Math.floor((total % 3600) / 60), total % 60];
  return parts.map((p) => String(p).padStart(2, "0")).join(":");
}

export function ResetCountdown({ nextResetAt }: { nextResetAt: string }): React.JSX.Element {
  // Rendered empty on the server: the value depends on the viewer's clock, and
  // shipping the server's would guarantee a hydration mismatch every time.
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    setLabel(remaining(nextResetAt));
    const timer = setInterval(() => setLabel(remaining(nextResetAt)), 1000);
    return () => clearInterval(timer);
  }, [nextResetAt]);

  return (
    <span className="font-mono text-[11px] tabular-nums text-fg-3">
      {label ? `NEW PUZZLES IN ${label}` : " "}
    </span>
  );
}
