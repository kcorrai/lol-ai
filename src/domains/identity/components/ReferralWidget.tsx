"use client";

import { useState } from "react";
import { useReferralStats } from "@/hooks/useReferralStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function ReferralWidget() {
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useReferralStats();

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
          <>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="font-semibold text-text">{data.totalInvited}</p>
                <p className="text-xs text-text-muted">Davet edildi</p>
              </div>
              <div>
                <p className="font-semibold text-success">{data.weeksEarned}</p>
                <p className="text-xs text-text-muted">Hafta kazanıldı</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span>{data.weeksEarned} / {data.maxWeeks} hafta</span>
                {data.weeksEarned >= data.maxWeeks && (
                  <span className="text-accent font-medium">Maksimum ödüle ulaştınız</span>
                )}
              </div>
              <div className="h-1.5 w-full rounded-full bg-surface-2">
                <div
                  className="h-1.5 rounded-full bg-accent transition-all"
                  style={{ width: `${Math.min((data.weeksEarned / data.maxWeeks) * 100, 100)}%` }}
                />
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
