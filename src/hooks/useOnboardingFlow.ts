"use client";

import { useEffect, useState } from "react";
import type { PlayerPerformanceProfile } from "@/domains/analysis/types/analysis.types";

export type OnboardingPhase =
  | "syncing"
  | "generating"
  | "polling"
  | "done"
  | "email_required"
  | "error";

export interface OnboardingFlowState {
  phase: OnboardingPhase;
  reportId: string | null;
  error: string | null;
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export function useOnboardingFlow(accountId: string): OnboardingFlowState {
  const [phase, setPhase] = useState<OnboardingPhase>("syncing");
  const [reportId, setReportId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // 1. Poll sync status until complete
      while (!cancelled) {
        try {
          const res = await fetch(`/api/riot/${accountId}/sync/status`);
          if (res.ok) {
            const { data } = await res.json() as {
              data: { syncCompletedAt: string | null; status: string; lastSyncError: string | null };
            };
            if (data.lastSyncError) { setError("Sync failed. Please try again."); return; }
            if (data.syncCompletedAt || data.status === "complete") break;
          }
        } catch { /* keep polling */ }
        if (!cancelled) await delay(2000);
      }
      if (cancelled) return;

      // 2. Fetch match IDs from performance profile
      setPhase("generating");
      try {
        const perfRes = await fetch(`/api/riot/${accountId}/performance`);
        if (!perfRes.ok) { setPhase("done"); return; }
        const { data: profile } = await perfRes.json() as { data: PlayerPerformanceProfile };

        const matchIds = profile.recentMatches.slice(0, 5).map((m) => m.matchDbId);
        if (matchIds.length === 0) { setPhase("done"); return; }

        // 3. Auto-generate first session review
        const genRes = await fetch("/api/coaching/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ riotAccountId: accountId, reportType: "session_review", matchIds }),
        });

        if (genRes.status === 403) {
          const body = await genRes.json() as { error?: { code?: string } };
          if (body.error?.code === "EMAIL_NOT_VERIFIED") { setPhase("email_required"); return; }
        }
        if (!genRes.ok) { setPhase("done"); return; }

        const { data: gen } = await genRes.json() as { data: { reportId: string } };
        setReportId(gen.reportId);
        setPhase("polling");

        // 4. Poll report status until complete
        while (!cancelled) {
          await delay(3000);
          const statusRes = await fetch(`/api/coaching/reports/${gen.reportId}/status`);
          if (!statusRes.ok) break;
          const { data: status } = await statusRes.json() as { data: { status: string } };
          if (status.status === "complete") { setPhase("done"); return; }
          if (status.status === "failed") { setPhase("done"); return; }
        }
      } catch {
        setPhase("done");
      }
    }

    void run();
    return () => { cancelled = true; };
  }, [accountId]);

  return { phase, reportId, error };
}
