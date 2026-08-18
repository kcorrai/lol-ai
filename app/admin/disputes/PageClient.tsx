"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ui/error-state";
import { useDisputes, useResolveDispute } from "@/hooks/useAdminDisputes";
import type { DisputeQueueStatus } from "@/hooks/useAdminDisputes";
import { formatMoney } from "@/domains/marketplace/money";
import { DisputeCard } from "@/domains/marketplace/components/DisputeCard";
import { ReviewQueueShell } from "@/domains/marketplace/components/admin/ReviewQueueShell";

const TABS: { status: DisputeQueueStatus; label: string }[] = [
  { status: "OPEN", label: "Open" },
  { status: "RESOLVED_REFUND", label: "Refunded" },
  { status: "RESOLVED_RELEASE", label: "Released" },
];

export default function AdminDisputesPage(): React.ReactElement {
  const [tab, setTab] = useState<DisputeQueueStatus>("OPEN");
  const { data, isLoading, isError, refetch } = useDisputes(tab);
  const resolve = useResolveDispute();
  const [error, setError] = useState<string | null>(null);

  const disputes = data?.disputes ?? [];
  const frozen = disputes.reduce((total, d) => total + d.amountCents, 0);
  const oldest = disputes[disputes.length - 1];

  return (
    <ReviewQueueShell
      tabs={TABS.map((t) => ({ key: t.status, label: t.label }))}
      active={tab}
      onTab={(key) => setTab(key as DisputeQueueStatus)}
      stats={[
        {
          label: tab === "OPEN" ? "Open" : "In this tab",
          value: String(disputes.length),
          tone: tab === "OPEN" && disputes.length > 0 ? "loss" : "default",
        },
        {
          label: tab === "OPEN" ? "Frozen" : "Total",
          value: formatMoney(frozen, disputes[0]?.currency ?? "USD"),
          tone: tab === "OPEN" && frozen > 0 ? "loss" : "default",
        },
        {
          label: "Oldest",
          value: oldest ? waitingFor(oldest.openedAt) : "—",
          tone: oldest && daysSince(oldest.openedAt) >= 3 ? "warn" : "default",
        },
      ]}
      count={disputes.length}
      empty={
        tab === "OPEN"
          ? "No sessions are being challenged. Money settles on its own while this stays empty."
          : "Nothing settled this way yet."
      }
    >
      {error && (
        <p className="border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      {isLoading && <Skeleton className="h-64 w-full" />}
      {isError && <ErrorState message="Could not load disputes." onRetry={() => void refetch()} />}

      {disputes.map((dispute) => (
        <DisputeCard
          key={dispute.id}
          dispute={dispute}
          pending={resolve.isPending}
          onResolve={(outcome, note) => {
            setError(null);
            resolve.mutate(
              { disputeId: dispute.id, outcome, note },
              {
                onError: (err) =>
                  setError(err instanceof Error ? err.message : "Could not settle that."),
              }
            );
          }}
        />
      ))}
    </ReviewQueueShell>
  );
}

function daysSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

/** How long the oldest one has been sitting there, which is the number that shames. */
function waitingFor(iso: string): string {
  const days = daysSince(iso);
  if (days >= 1) return `${days}d`;
  return `${Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 3_600_000))}h`;
}
