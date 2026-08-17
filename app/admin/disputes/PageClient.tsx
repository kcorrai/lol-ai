"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { useDisputes, useResolveDispute } from "@/hooks/useAdminDisputes";
import type { DisputeQueueStatus } from "@/hooks/useAdminDisputes";
import { DisputeCard } from "@/domains/marketplace/components/DisputeCard";

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-text">Disputes</h1>
        <p className="mt-1 text-sm text-text-muted">
          Each one is decided against the booking&apos;s own recorded history, which both sides
          have been able to read the whole time.
        </p>
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
      {isError && <ErrorState message="Could not load disputes." onRetry={() => void refetch()} />}

      {data !== undefined && data.disputes.length === 0 && (
        <EmptyState
          title="Nothing here"
          description={tab === "OPEN" ? "No sessions are being challenged." : "Nothing settled this way yet."}
        />
      )}

      <div className="space-y-4">
        {data?.disputes.map((dispute) => (
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
      </div>
    </div>
  );
}
