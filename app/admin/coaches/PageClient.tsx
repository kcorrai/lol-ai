"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useCoachQueue, useDecideCoach } from "@/hooks/useAdminCoaches";
import type { CoachQueueStatus } from "@/hooks/useAdminCoaches";
import { ApplicationReviewCard } from "@/domains/marketplace/components/ApplicationReviewCard";

type Decision = "approve" | "reject" | "suspend" | "reinstate";

// Which decisions each queue offers. A tab that showed every button would let a
// reviewer try transitions the service is going to refuse anyway.
const TABS: { status: CoachQueueStatus; label: string; decisions: Decision[] }[] = [
  { status: "PENDING", label: "In review", decisions: ["approve", "reject"] },
  { status: "APPROVED", label: "Live", decisions: ["suspend"] },
  { status: "SUSPENDED", label: "Suspended", decisions: ["reinstate"] },
  { status: "REJECTED", label: "Declined", decisions: [] },
];

export default function AdminCoachesPage(): React.ReactElement {
  const [tab, setTab] = useState<CoachQueueStatus>("PENDING");
  const { data, isLoading, isError, refetch } = useCoachQueue(tab);
  const decide = useDecideCoach();
  const [error, setError] = useState<string | null>(null);

  const active = TABS.find((t) => t.status === tab) ?? TABS[0];

  function handleDecide(coachProfileId: string, decision: Decision, note: string): void {
    setError(null);
    const payload =
      decision === "approve"
        ? ({ coachProfileId, decision } as const)
        : ({ coachProfileId, decision, note } as const);

    decide.mutate(payload, {
      onError: (err) =>
        setError(err instanceof Error ? err.message : "Could not record that decision."),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl font-bold text-text">Coaches</h1>
        {data !== undefined && data.pending > 0 && (
          <p className="font-mono text-xs text-accent">{data.pending} waiting</p>
        )}
      </div>

      <nav className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.status}
            type="button"
            onClick={() => setTab(t.status)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs font-medium transition-colors",
              t.status === tab
                ? "border-accent bg-accent/15 text-accent"
                : "border-border bg-surface-2 text-text-muted hover:text-text"
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && (
        <p className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {isLoading && <Skeleton className="h-64 w-full" />}

      {isError && (
        <ErrorState message="Could not load the review queue." onRetry={() => void refetch()} />
      )}

      {data !== undefined && data.applications.length === 0 && (
        <EmptyState
          title="Nothing here"
          description={
            tab === "PENDING"
              ? "No applications are waiting on a decision."
              : "No coaches in this state."
          }
        />
      )}

      <div className="space-y-4">
        {data?.applications.map((application) => (
          <ApplicationReviewCard
            key={application.id}
            application={application}
            decisions={active.decisions}
            pending={decide.isPending}
            onDecide={(decision, note) => handleDecide(application.id, decision, note)}
          />
        ))}
      </div>
    </div>
  );
}
