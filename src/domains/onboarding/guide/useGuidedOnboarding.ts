"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useCoachingReports } from "@/hooks/useCoachingReports";
import { useCompleteOnboarding } from "@/hooks/useCompleteOnboarding";
import { GUIDE_STEPS, storageKeyFor, type GuideGates, type GuideStep } from "./guideSteps";
import type { SpotRect } from "./SpotlightOverlay";

// Should the engine roll past this step given the live world? (manual steps never auto-advance.)
function shouldAutoAdvance(step: GuideStep, gates: GuideGates, pathname: string): boolean {
  if (step.satisfiedGate && gates[step.satisfiedGate]) return true;
  if (step.advance.type === "route") return pathname.startsWith(step.advance.route);
  if (step.advance.type === "state") return gates[step.advance.gate];
  return false;
}

function findTarget(target?: string): HTMLElement | null {
  if (!target) return null;
  const els = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`));
  return els.find((e) => e.offsetParent !== null || e.getBoundingClientRect().width > 0) ?? null;
}

function readStoredIndex(storageKey: string): number {
  try {
    const raw = localStorage.getItem(storageKey);
    const n = raw ? parseInt(raw, 10) : 0;
    return Number.isFinite(n) && n >= 0 && n < GUIDE_STEPS.length ? n : 0;
  } catch {
    return 0;
  }
}

export interface GuidedOnboardingState {
  active: boolean;
  step: GuideStep;
  index: number;
  total: number;
  rect: SpotRect | null;
  manualAdvance: () => void;
  goTo: (href: string) => void;
}

export function useGuidedOnboarding(userId: string | null): GuidedOnboardingState {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const complete = useCompleteOnboarding();

  // Per-user storage key so one account's step progress never bleeds onto another (TASK-218).
  const storageKey = useMemo(() => storageKeyFor(userId), [userId]);

  const [mounted, setMounted] = useState(false);
  const [index, setIndex] = useState(0);
  const [done, setDone] = useState(false);
  const [rect, setRect] = useState<SpotRect | null>(null);

  // Live gates.
  const { data: accounts } = useRiotAccounts();
  const primaryId = accounts?.[0]?.id ?? null;
  const { data: profile } = usePerformanceProfile(primaryId);
  const { data: reports } = useCoachingReports(primaryId ?? undefined);

  const gates: GuideGates = useMemo(
    () => ({
      hasAccount: (accounts?.length ?? 0) > 0,
      hasMatches: (profile?.recentMatches?.length ?? 0) > 0,
      hasCompleteReport: (reports?.pages ?? []).some((p) => p.reports.some((r) => r.status === "complete")),
    }),
    [accounts, profile, reports],
  );

  useEffect(() => {
    setMounted(true);
    setIndex(readStoredIndex(storageKey));
  }, [storageKey]);

  // Fast-forward + auto-advance: roll to the first step the user actually has to act on.
  useEffect(() => {
    if (!mounted || done) return;
    const last = GUIDE_STEPS.length - 1;
    let i = index;
    while (i < last && shouldAutoAdvance(GUIDE_STEPS[i], gates, pathname)) i += 1;
    if (i !== index) {
      setIndex(i);
      try {
        localStorage.setItem(storageKey, String(i));
      } catch {
        /* ignore */
      }
    }
  }, [mounted, done, index, gates, pathname, storageKey]);

  const step = GUIDE_STEPS[index];

  // Track the current target's rect (rAF-driven; follows scroll/layout, skips no-op updates).
  useEffect(() => {
    if (!mounted || done || !step.target) {
      setRect(null);
      return;
    }
    const initial = findTarget(step.target);
    initial?.scrollIntoView({ block: "center", behavior: "smooth" });

    const pad = step.padding ?? 0;
    let raf = 0;
    const tick = () => {
      const el = findTarget(step.target);
      if (el) {
        const r = el.getBoundingClientRect();
        const next: SpotRect = { top: r.top - pad, left: r.left - pad, width: r.width + pad * 2, height: r.height + pad * 2 };
        setRect((prev) =>
          prev && prev.top === next.top && prev.left === next.left && prev.width === next.width && prev.height === next.height ? prev : next,
        );
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [mounted, done, step]);

  // While a step waits on a live gate (connecting, syncing, generating a report), the underlying
  // React Query caches are stale-cached and won't refetch on their own — actively re-poll them so
  // the gate flips as soon as the real work lands.
  useEffect(() => {
    if (!mounted || done || step.advance.type !== "state") return;
    const id = window.setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["riot-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["performance-profile"] });
      queryClient.invalidateQueries({ queryKey: ["coaching-reports"] });
    }, 2500);
    return () => window.clearInterval(id);
  }, [mounted, done, step, queryClient]);

  const manualAdvance = useCallback(() => {
    if (step.isFinal) {
      complete.mutate(undefined, { onSettled: () => setDone(true) });
      try {
        localStorage.setItem(storageKey, String(GUIDE_STEPS.length - 1));
      } catch {
        /* ignore */
      }
      return;
    }
    const nextIndex = Math.min(index + 1, GUIDE_STEPS.length - 1);
    setIndex(nextIndex);
    try {
      localStorage.setItem(storageKey, String(nextIndex));
    } catch {
      /* ignore */
    }
  }, [step, index, complete, storageKey]);

  const goTo = useCallback((href: string) => router.push(href), [router]);

  const active = mounted && !done;

  // Keep a stable ref-free return; consumers guard on `active`.
  return { active, step, index, total: GUIDE_STEPS.length, rect, manualAdvance, goTo };
}
