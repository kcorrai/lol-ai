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
  if (!date) return "Hiç senkronize edilmedi";
  const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (secs < 60) return "Az önce";
  if (secs < 3600) return `${Math.floor(secs / 60)} dk önce`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} s önce`;
  return `${Math.floor(secs / 86400)} g önce`;
}

function AccountCard({ id, gameName, tagLine, region, isPrimary, lastSyncedAt, profileIconId, summonerLevel, canDisconnect }: {
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
    <div className="rounded-lg border border-border bg-surface-2 p-4 space-y-3">
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
            <p className="text-xs text-text-muted mt-0.5">
              {region.toUpperCase()} · {relativeTime(lastSyncedAt)}
            </p>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          {isPrimary && <Badge variant="secondary" className="text-xs">Birincil</Badge>}
        </div>
      </div>

      {syncStatus?.status === "RUNNING" || syncStatus?.status === "PENDING" ? (
        <p className="text-xs text-accent animate-pulse">Senkronize ediliyor…</p>
      ) : syncStatus?.status === "COMPLETED" ? (
        <p className="text-xs text-success">Senkronize edildi</p>
      ) : syncStatus?.status === "FAILED" ? (
        <p className="text-xs text-danger">
          Senkronizasyon başarısız — &quot;Şimdi Senkronize Et&quot; ile tekrar dene.
        </p>
      ) : null}
      {sync.isError && sync.variables === id && (
        <p className="text-xs text-danger">{sync.error.message}</p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => sync.mutate(id)}
          disabled={isSyncing || disconnect.isPending}
        >
          {isSyncing ? "Senkronize ediliyor…" : "Şimdi Senkronize Et"}
        </Button>

        {!isPrimary && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setPrimary.mutate(id)}
            disabled={isSettingPrimary}
          >
            {isSettingPrimary ? "Ayarlanıyor…" : "Birincil Yap"}
          </Button>
        )}

        {canDisconnect && (
          !confirmDisconnect ? (
            <Button
              size="sm"
              variant="ghost"
              className="text-danger hover:text-danger"
              onClick={() => setConfirmDisconnect(true)}
            >
              Bağlantıyı Kes
            </Button>
          ) : (
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => disconnect.mutate(id)}
                disabled={disconnect.isPending}
              >
                {disconnect.isPending ? "Kaldırılıyor…" : "Onayla"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setConfirmDisconnect(false)}>
                İptal
              </Button>
            </div>
          )
        )}
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
    return (
      <p className="text-sm text-text-muted">Henüz bağlı hesap yok. Aşağıda bir tane ekle.</p>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <AccountCard key={account.id} {...account} canDisconnect={canDisconnect} />
      ))}
    </div>
  );
}
