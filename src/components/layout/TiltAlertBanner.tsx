"use client";

import { X } from "lucide-react";
import { useTiltAlerts, useAcknowledgeTiltAlert } from "@/hooks/useTiltAlerts";

export function TiltAlertBanner() {
  const { data: alerts } = useTiltAlerts();
  const { mutate: acknowledge, isPending } = useAcknowledgeTiltAlert();

  const alert = alerts?.[0];
  if (!alert) return null;

  return (
    <div className="relative border-b border-danger/40 bg-danger/10 px-4 py-3">
      <div className="mx-auto flex max-w-6xl items-start gap-3">
        <span className="mt-0.5 shrink-0 text-base">🔴</span>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-danger">
            Tilt Uyarısı — {alert.streakLength} Üst Üste Kayıp
          </p>
          <p className="mt-0.5 text-sm text-text-muted">{alert.message}</p>
        </div>
        <button
          onClick={() => acknowledge(alert.id)}
          disabled={isPending}
          aria-label="Kapat"
          className="shrink-0 rounded p-1 text-text-muted transition-colors hover:text-text disabled:opacity-40"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
