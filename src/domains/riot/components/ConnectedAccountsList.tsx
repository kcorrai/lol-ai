"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useSyncAccount } from "@/hooks/useSyncAccount";
import { useDisconnectAccount } from "@/hooks/useDisconnectAccount";

function relativeTime(date: string | Date | null): string {
  if (!date) return "Never synced";
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function AccountCard({ id, gameName, tagLine, region, isPrimary, lastSyncedAt }: {
  id: string;
  gameName: string;
  tagLine: string;
  region: string;
  isPrimary: boolean;
  lastSyncedAt: Date | null;
}) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const sync = useSyncAccount();
  const disconnect = useDisconnectAccount();

  const syncId = sync.variables === id ? sync : null;
  const isSyncing = syncId?.isPending ?? false;
  const syncResult = syncId?.data;

  return (
    <div className="rounded-lg border border-border bg-surface-2 p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-medium text-text">
            {gameName}
            <span className="text-text-muted">#{tagLine}</span>
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {region.toUpperCase()} · {relativeTime(lastSyncedAt)}
          </p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {isPrimary && <Badge variant="secondary" className="text-xs">Primary</Badge>}
        </div>
      </div>

      {syncResult && (
        <p className="text-xs text-success">
          {syncResult.status === "fresh"
            ? "Data is up to date"
            : `Synced — ${syncResult.newMatches ?? 0} new matches`}
        </p>
      )}
      {sync.isError && sync.variables === id && (
        <p className="text-xs text-danger">{sync.error.message}</p>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => sync.mutate(id)}
          disabled={isSyncing || disconnect.isPending}
        >
          {isSyncing ? "Syncing…" : "Sync Now"}
        </Button>

        {!confirmDisconnect ? (
          <Button
            size="sm"
            variant="ghost"
            className="text-danger hover:text-danger"
            onClick={() => setConfirmDisconnect(true)}
          >
            Disconnect
          </Button>
        ) : (
          <div className="flex gap-1.5">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => disconnect.mutate(id)}
              disabled={disconnect.isPending}
            >
              {disconnect.isPending ? "Removing…" : "Confirm"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setConfirmDisconnect(false)}>
              Cancel
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ConnectedAccountsList() {
  const { data: accounts, isLoading } = useRiotAccounts();

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return (
      <p className="text-sm text-text-muted">No accounts connected yet. Add one below.</p>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountCard key={account.id} {...account} />
      ))}
    </div>
  );
}
