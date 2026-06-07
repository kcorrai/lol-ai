"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/fetcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { ReferralStats } from "@/domains/identity/services/referralService";

export function ReferralWidget() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery<ReferralStats>({
    queryKey: ["referral-stats"],
    queryFn: () => apiFetch("/api/referral/stats"),
    staleTime: 5 * 60 * 1000,
  });

  const appUrl =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://lolaicoach.gg";

  const shareUrl = data ? `${appUrl}/register?ref=${data.code}` : "";

  async function handleCopy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-widest text-text-muted">
          Arkadaşını Davet Et
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-text-muted">
          Arkadaşın davet linkinle kaydolup Riot hesabını bağlarsa <span className="font-semibold text-accent">ikiniz de 7 gün Pro</span> kazanırsınız.
        </p>

        {isLoading ? (
          <div className="h-9 w-full animate-pulse rounded-lg bg-surface-2" />
        ) : (
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-text-muted"
            />
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? "Kopyalandı!" : "Kopyala"}
            </Button>
          </div>
        )}

        {data && (
          <div className="flex gap-6 text-sm">
            <div>
              <p className="font-semibold text-text">{data.totalInvited}</p>
              <p className="text-xs text-text-muted">Davet edildi</p>
            </div>
            <div>
              <p className="font-semibold text-success">{data.totalCompleted}</p>
              <p className="text-xs text-text-muted">Ödül kazanıldı</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
