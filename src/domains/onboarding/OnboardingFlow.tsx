"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Zap, Target, TrendingUp, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useOnboardingFlow } from "@/hooks/useOnboardingFlow";
import { usePostHog } from "posthog-js/react";

const FEATURES = [
  { icon: Zap,        title: "AI Coach",           description: "Personal analysis for every match" },
  { icon: Target,     title: "Action Plan",     description: "Concrete improvement steps" },
  { icon: TrendingUp, title: "Progress Tracking",   description: "Weekly growth metrics" },
];

function SyncPhaseLabel({ phase }: { phase: string }) {
  const labels: Record<string, string> = {
    syncing:    "Loading your match history…",
    generating: "Preparing your first report…",
    polling:    "AI is analyzing your matches…",
    done:       "Ready!",
    email_required: "Email verification required",
    error:      "Something went wrong",
  };
  return <>{labels[phase] ?? "Processing…"}</>;
}

function ProgressDots({ phase }: { phase: string }) {
  const steps = [
    { key: "syncing",    label: "Data Sync" },
    { key: "generating", label: "Start AI" },
    { key: "polling",    label: "Analysis" },
    { key: "done",       label: "Ready" },
  ];
  const order = ["syncing", "generating", "polling", "done"];
  const current = order.indexOf(phase);

  return (
    <div className="flex items-center gap-0">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={cn(
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all",
              i < current  ? "bg-accent/50 text-white"
              : i === current ? "bg-accent text-white ring-2 ring-accent/30"
              : "bg-border text-text-muted"
            )}>
              {i < current ? <CheckCircle2 className="h-3 w-3" /> : i + 1}
            </div>
            <span className="text-[10px] text-text-muted">{s.label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={cn(
              "mb-4 h-px w-8 transition-colors",
              i < current ? "bg-accent/50" : "bg-border"
            )} />
          )}
        </div>
      ))}
    </div>
  );
}

// CSS-only confetti burst rendered on mount
function Confetti() {
  const colors = ["#C89B3C", "#4ADE80", "#60A5FA", "#F472B6", "#A78BFA"];
  const pieces = Array.from({ length: 24 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((i) => {
        const color = colors[i % colors.length];
        const left = `${4 + (i * 4) % 92}%`;
        const delay = `${(i * 120) % 800}ms`;
        const duration = `${700 + (i * 80) % 600}ms`;
        return (
          <div
            key={i}
            style={{ left, color, animationDelay: delay, animationDuration: duration }}
            className="absolute top-0 animate-[confetti-fall_0.8s_ease-in_forwards] text-sm"
          >
            {i % 3 === 0 ? "■" : i % 3 === 1 ? "●" : "▲"}
          </div>
        );
      })}
    </div>
  );
}

interface SyncingStepProps {
  accountId: string;
  gameName: string;
  onComplete: (reportId: string | null) => void;
}

export function SyncingStep({ accountId, gameName, onComplete }: SyncingStepProps) {
  const { phase, reportId, error } = useOnboardingFlow(accountId);
  const posthog = usePostHog();
  const notifiedRef = useRef(false);

  useEffect(() => {
    if ((phase === "done" || phase === "email_required") && !notifiedRef.current) {
      notifiedRef.current = true;
      posthog?.capture("onboarding_flow_completed", { phase, hasReport: !!reportId });
      onComplete(reportId);
    }
  }, [phase, reportId, onComplete, posthog]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h2 className="font-display text-2xl font-bold text-text">
          Hi, {gameName}!
        </h2>
        <p className="text-sm text-text-muted">
          <SyncPhaseLabel phase={error ? "error" : phase} />
        </p>
      </div>

      <div className="flex justify-center">
        <ProgressDots phase={phase} />
      </div>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-center text-sm text-danger">
          {error}
        </p>
      )}

      <div className="space-y-3 rounded-xl border border-border bg-surface-2 p-4">
        <p className="text-xs font-medium uppercase tracking-widest text-text-muted">
          What&apos;s Waiting for You
        </p>
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <div key={title} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <div>
              <p className="text-sm font-semibold text-text">{title}</p>
              <p className="text-xs text-text-muted">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface FinalStepProps {
  gameName: string;
  reportId: string | null;
  emailRequired: boolean;
}

export function FinalStep({ gameName, reportId, emailRequired }: FinalStepProps) {
  return (
    <div className="relative space-y-8 overflow-hidden rounded-xl">
      {reportId && <Confetti />}
      <div className="relative flex flex-col items-center gap-4 text-center">
        <div className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl",
          reportId ? "bg-accent/15" : "bg-green-500/15"
        )}>
          {reportId ? (
            <Trophy className="h-8 w-8 text-accent" />
          ) : (
            <CheckCircle2 className="h-8 w-8 text-green-400" />
          )}
        </div>
        <div>
          <h2 className="font-display text-2xl font-bold text-text">
            {reportId ? `Your first report is ready, ${gameName}!` : `You&apos;re all set, ${gameName}!`}
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {emailRequired
              ? "After you verify your email, you can start using AI reports."
              : reportId
              ? "Your AI coach has analyzed your matches. Let&apos;s go!"
              : "Your match history is being prepared in the background."}
          </p>
        </div>
      </div>

      <div className="relative space-y-3">
        {reportId ? (
          <Link href={`/coaching/${reportId}`}>
            <Button className="w-full" size="lg">
              View First Report →
            </Button>
          </Link>
        ) : (
          <Link href="/coaching">
            <Button className="w-full" size="lg">
              Go to Coaching →
            </Button>
          </Link>
        )}
        <p className="text-center">
          <Link href="/dashboard" className="text-xs text-text-muted/60 underline-offset-2 hover:text-text-muted hover:underline transition-colors">
            Go to dashboard for now
          </Link>
        </p>
      </div>
    </div>
  );
}

// Loading spinner for the syncing phase with a manual skip after 90s
export function SyncLoadingIndicator() {
  return <Loader2 className="mx-auto h-6 w-6 animate-spin text-accent" />;
}
