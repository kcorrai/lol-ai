"use client";

import { useState, useEffect } from "react";
import { useTiltStatus } from "@/hooks/useTiltStatus";
import { useOnboardingPreview } from "@/domains/onboarding/preview/OnboardingPreviewContext";

const OVERRIDE_KEY = "tilt-break-dismissed-at";
const COOLDOWN_MS = 2 * 60 * 60 * 1000; // don't re-show for 2 hours after dismissal

interface TiltBreakModalProps {
  riotAccountId: string | null | undefined;
}

export function TiltBreakModal({ riotAccountId }: TiltBreakModalProps) {
  const { data: tilt, isLoading } = useTiltStatus(riotAccountId);
  // Suppress during the forced first-journey — this full-screen modal would sit over the match row
  // the tour asks the user to click, blocking it (TASK-221).
  const { previewActive } = useOnboardingPreview();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isLoading || !tilt || tilt.level !== "tilting") return;
    const raw = localStorage.getItem(OVERRIDE_KEY);
    if (raw && Date.now() - parseInt(raw, 10) < COOLDOWN_MS) return;
    setVisible(true);
  }, [tilt, isLoading]);

  function dismiss() {
    localStorage.setItem(OVERRIDE_KEY, String(Date.now()));
    setVisible(false);
  }

  if (previewActive || !visible || !tilt) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl">
        <p className="mb-1 text-lg font-semibold text-text">You might be on tilt.</p>
        <p className="mb-4 text-sm text-text-muted">
          {tilt.lossStreak} losses in a row. Your performance typically drops during streaks like
          this — playing ranked right now is likely to cost you LP, not earn it.
        </p>

        <div className="mb-5 rounded-lg bg-danger/10 px-4 py-3">
          <div className="flex gap-5 text-xs font-medium text-danger">
            <span>Loss streak: {tilt.lossStreak}</span>
            <span>Recent WR: {Math.round(tilt.recentWinRate * 100)}%</span>
            <span>KDA trend: {tilt.kdaTrend === "declining" ? "↓ declining" : tilt.kdaTrend}</span>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={dismiss}
            className="flex-1 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Take a 20-min break
          </button>
          <button
            onClick={dismiss}
            className="rounded-lg border border-border px-4 py-2.5 text-sm text-text-muted transition-colors hover:text-text"
          >
            Play anyway
          </button>
        </div>
      </div>
    </div>
  );
}
