"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { profileIconUrl } from "@/lib/ddragon";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useSyncAccount } from "@/hooks/useSyncAccount";
import { useSyncStatus, isSyncActive } from "@/hooks/useSyncStatus";
import { useDisconnectAccount } from "@/hooks/useDisconnectAccount";
import { useSetPrimaryAccount } from "@/hooks/useSetPrimaryAccount";
import { useSubscription } from "@/hooks/useSubscription";

function relativeTime(date: string | Date | null): string {
  if (!date) return "Never synced";
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "Just now";
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
  return `${Math.floor(secs / 86400)}d ago`;
}

function AccountCard({
  id,
  gameName,
  tagLine,
  region,
  isPrimary,
  lastSyncedAt,
  profileIconId,
  summonerLevel,
  canDisconnect,
}: {
  id: string;
  gameName: string;
  tagLine: string;
  region: string;
  isPrimary: boolean;
  lastSyncedAt: Date | null;
  profileIconId: number;
  summonerLevel: number;
  canDisconnect: boolean;
}) {
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const sync = useSyncAccount();
  const { data: syncStatus } = useSyncStatus(id);
  const disconnect = useDisconnectAccount();
  const setPrimary = useSetPrimaryAccount();

  const isSyncing = (sync.variables === id && sync.isPending) || isSyncActive(syncStatus?.status);
  const isSettingPrimary = setPrimary.isPending && setPrimary.variables === id;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Image
              src={profileIconUrl(profileIconId)}
              alt={gameName}
              width={48}
              height={48}
              unoptimized
              className="rounded-full border-2 border-border"
            />
            <span className="absolute -bottom-1 -right-1 rounded-full bg-surface px-1 text-[10px] font-bold text-text-muted ring-1 ring-border">
              {summonerLevel}
            </span>
          </div>
          <div>
            <p className="font-medium text-text">
              {gameName}
              <span className="text-text-muted">#{tagLine}</span>
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              {region.toUpperCase()} · {relativeTime(lastSyncedAt)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-1.5">
          {isPrimary && (
            <Badge variant="secondary" className="text-xs">
              Primary
            </Badge>
          )}
        </div>
      </div>

      {syncStatus?.status === "RUNNING" || syncStatus?.status === "PENDING" ? (
        <p className="animate-pulse text-xs text-accent">Syncing…</p>
      ) : syncStatus?.status === "COMPLETED" ? (
        <p className="text-xs text-success">Synced</p>
      ) : syncStatus?.status === "FAILED" ? (
        <p className="text-xs text-danger">Sync failed — try again with &quot;Sync Now&quot;.</p>
      ) : null}
      {/*
        A rejected mutation used to render nothing at all: the user pressed Confirm and the row
        simply did not change. role="status" because the message appears well away from the button
        that was pressed.
      */}
      {sync.isError && sync.variables === id && (
        <p role="status" className="text-xs text-danger">
          {sync.error.message}
        </p>
      )}
      {setPrimary.isError && (
        <p role="status" className="text-xs text-danger">
          {setPrimary.error.message}
        </p>
      )}
      {disconnect.isError && (
        <p role="status" className="text-xs text-danger">
          {disconnect.error.message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => sync.mutate(id)}
          disabled={isSyncing || disconnect.isPending}
        >
          {isSyncing ? "Syncing…" : "Sync Now"}
        </Button>

        {!isPrimary && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPrimary.mutate(id)}
            disabled={isSettingPrimary}
          >
            {isSettingPrimary ? "Setting…" : "Make Primary"}
          </Button>
        )}

        {canDisconnect &&
          (!confirmDisconnect ? (
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
          ))}
      </div>
    </div>
  );
}

export function ConnectedAccountsList() {
  const { data: accounts, isLoading } = useRiotAccounts();
  const { data: subscription } = useSubscription();

  const canDisconnect = subscription?.plan !== "free";

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
    );
  }

  if (!accounts || accounts.length === 0) {
    return <p className="text-sm text-text-muted">No connected accounts yet. Add one below.</p>;
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountCard key={account.id} {...account} canDisconnect={canDisconnect} />
      ))}
    </div>
  );
}
