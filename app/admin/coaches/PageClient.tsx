"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useCoachQueue, useDecideCoach } from "@/hooks/useAdminCoaches";
import type { CoachQueueStatus } from "@/hooks/useAdminCoaches";
import { ApplicationReviewCard } from "@/domains/marketplace/components/ApplicationReviewCard";
import { ReviewQueueShell } from "@/domains/marketplace/components/admin/ReviewQueueShell";

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
  const applications = data?.applications ?? [];
  const unchecked = applications.filter((a) => a.rankProofs.length === 0).length;

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
    <ReviewQueueShell
      tabs={TABS.map((t) => ({ key: t.status, label: t.label }))}
      active={tab}
      onTab={(key) => setTab(key as CoachQueueStatus)}
      stats={[
        {
          label: "Waiting",
          value: String(data?.pending ?? 0),
          tone: (data?.pending ?? 0) > 0 ? "warn" : "accent",
        },
        { label: "In this tab", value: String(applications.length) },
        {
          label: "No rank checked",
          value: String(unchecked),
          tone: unchecked > 0 ? "warn" : "default",
        },
      ]}
      count={applications.length}
      empty={
        tab === "PENDING"
          ? "No applications are waiting on a decision. New ones land here within a minute of being sent."
          : "No coaches in this state."
      }
    >
      {error && (
        <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {isLoading && <Skeleton className="h-64 w-full" />}

      {isError && (
        <ErrorState message="Could not load the review queue." onRetry={() => void refetch()} />
      )}

      {applications.map((application) => (
        <ApplicationReviewCard
          key={application.id}
          application={application}
          decisions={active.decisions}
          pending={decide.isPending}
          onDecide={(decision, note) => handleDecide(application.id, decision, note)}
        />
      ))}
    </ReviewQueueShell>
  );
}
