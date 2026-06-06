"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ImprovementPlanWidget } from "@/domains/analysis/components/ImprovementPlanWidget";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useSubscription } from "@/hooks/useSubscription";
import { usePlanHistory } from "@/hooks/useImprovementPlan";
import type { PlanHistoryEntry } from "@/domains/analysis/services/improvementPlanService";
import { cn } from "@/lib/utils";

function PlanHistoryCard({ entry }: { entry: PlanHistoryEntry }) {
  const date = new Date(entry.createdAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
  const exDate = new Date(entry.expiresAt).toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
  });
  const scoreColor =
    entry.weeklyScore >= 66
      ? "text-green-400"
      : entry.weeklyScore >= 33
      ? "text-yellow-400"
      : "text-red-400";
  const isActive = entry.status === "active";

  return (
    <div
      className={cn(
        "rounded-xl border bg-surface p-4",
        isActive ? "border-indigo-500/40" : "border-border"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-text">
            {date} — {exDate}
          </p>
          <p className="text-xs text-text-muted mt-0.5">
            {entry.completedCount}/{entry.totalTargets} hedef tamamlandı
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <span className="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full">
              Aktif
            </span>
          )}
          <span className={cn("text-lg font-bold", scoreColor)}>
            {entry.weeklyScore}/100
          </span>
        </div>
      </div>

      <div className="h-1.5 rounded-full bg-border overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            entry.weeklyScore >= 66
              ? "bg-green-500"
              : entry.weeklyScore >= 33
              ? "bg-yellow-500"
              : "bg-red-500/60"
          )}
          style={{ width: `${entry.weeklyScore}%` }}
        />
      </div>
    </div>
  );
}

export default function ImprovementPage() {
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const { data: subscription } = useSubscription();

  const primaryAccount = accounts?.find((a) => a.isPrimary) ?? accounts?.[0];
  const riotAccountId = primaryAccount?.id ?? null;
  const isPro = subscription?.plan === "pro" || subscription?.plan === "elite";

  const { data: history, isLoading: historyLoading } = usePlanHistory(riotAccountId);

  if (accountsLoading) return <PageSkeleton />;

  if (!primaryAccount) {
    return (
      <div className="space-y-6">
        <PageHeader title="Gelişim Takibi" subtitle="Hedeflerini belirle, ilerlemeni takip et." />
        <EmptyState
          title="Riot hesabı bağlı değil"
          description="Gelişim planı oluşturmak için önce Riot hesabını bağla."
          action={
            <Link
              href="/settings/accounts"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90"
            >
              Hesap Bağla
            </Link>
          }
        />
      </div>
    );
  }

  const historyEntries = Array.isArray(history) ? (history as PlanHistoryEntry[]) : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gelişim Takibi"
        subtitle="AI koçunun verdiği hedefleri gerçekleştiriyor musun?"
        action={
          <TrendingUp className="h-5 w-5 text-text-muted" aria-hidden />
        }
      />

      <section className="space-y-2">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Aktif Plan
        </h2>
        <ImprovementPlanWidget riotAccountId={riotAccountId} />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">
          Geçmiş Planlar
        </h2>

        {historyLoading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-border bg-surface animate-pulse"
              />
            ))}
          </div>
        ) : historyEntries.length === 0 ? (
          <p className="text-sm text-text-muted">Henüz tamamlanmış plan yok.</p>
        ) : (
          <div className="space-y-3">
            {historyEntries.map((entry) => (
              <PlanHistoryCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}

        {!isPro && historyEntries.length > 0 && (
          <p className="text-xs text-text-muted text-center pt-2">
            Sınırsız plan geçmişi için{" "}
            <Link href="/settings/subscription" className="text-indigo-400 hover:underline">
              Pro&apos;ya geç
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
