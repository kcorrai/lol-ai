"use client";

import { useEffect, useState } from "react";
import { ResetCountdown, puzzleNumber, utcDateKey } from "@/domains/quiz";

/**
 * `Puzzle #961 · new set in 12:03:34`. Both halves read the viewer's clock, so
 * both are filled in after mount — the landing page is statically rendered and
 * a build-time puzzle number would be wrong by the next morning.
 */
export function DailyStatus(): React.ReactElement {
  const [number, setNumber] = useState<number>();

  useEffect(() => setNumber(puzzleNumber(utcDateKey(new Date()))), []);

  return (
    <span className="font-mono text-[11px] uppercase tracking-label text-accent">
      {number ? `Puzzle #${number}` : "Today's set"} · New set in <ResetCountdown />
    </span>
  );
}
