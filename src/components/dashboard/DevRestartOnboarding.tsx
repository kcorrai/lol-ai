"use client";

import { useState } from "react";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api/fetcher";
import { storageKeyFor } from "@/domains/onboarding/guide/guideSteps";

// Dev-only shortcut to replay the forced first-journey on the current account (TASK-226).
// Renders nothing in production; the reset endpoint is likewise guarded server-side.
export function DevRestartOnboarding(): React.JSX.Element | null {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  if (process.env.NODE_ENV === "production") return null;

  async function restart() {
    if (!user?.id || busy) return;
    setBusy(true);
    try {
      await apiFetch("/api/onboarding/reset", { method: "POST" });
      // Clear the per-user step index so the tour starts from the beginning, not a stale step.
      try {
        localStorage.removeItem(storageKeyFor(user.id));
      } catch {
        /* ignore */
      }
      // Full reload so the SSR onboarding gate re-mounts the overlay from step 0.
      window.location.href = "/dashboard";
    } catch {
      setBusy(false);
    }
  }

  // Anchored bottom right. Bottom left is where the sidebar keeps Log out, and this
  // sat on top of it — a click meant for Log out landed on the dev button instead.
  return (
    <button
      onClick={restart}
      disabled={busy}
      title="Dev only: reset onboarding and replay the guided tour"
      className="fixed bottom-4 right-4 z-40 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-surface/90 px-3 py-2 text-xs font-medium text-text-muted shadow-lg backdrop-blur transition-colors hover:text-accent disabled:opacity-50"
    >
      <GraduationCap className="h-3.5 w-3.5" />
      {busy ? "Restarting…" : "Restart onboarding"}
      <span className="rounded bg-surface-2 px-1 text-[9px] uppercase tracking-wider text-text-muted/60">
        dev
      </span>
    </button>
  );
}
