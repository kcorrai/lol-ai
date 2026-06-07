"use client";

import { TrendingUp, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { useImprovementPlan, useGeneratePlan } from "@/hooks/useImprovementPlan";
import { championSplashUrl } from "@/lib/ddragon";
import { cn } from "@/lib/utils";
import type { PlanProgress } from "@/domains/analysis/types/analysis.types";

interface ImprovementPlanWidgetProps {
  riotAccountId: string | null | undefined;
}

function ProgressBar({ target }: { target: PlanProgress }) {
  const pct = Math.round(target.progress * 100);
  const achieved = target.achieved;
  const onTrack = !achieved && target.progress >= 0.5;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-text">{target.label}</span>
        <span
          className={cn(
            "flex items-center gap-1 font-medium",
            achieved ? "text-success" : onTrack ? "text-warning" : "text-text-muted"
          )}
        >
          {achieved ? (
            <><CheckCircle2 className="h-3 w-3" /> Tamamlandı</>
          ) : onTrack ? (
            "↑ Yolunda"
          ) : (
            "→ Çalışılıyor"
          )}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700",
            achieved ? "bg-success" : onTrack ? "bg-warning" : "bg-accent/60"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex justify-between text-[11px] text-text-muted">
        <span>Mevcut: <span className="font-medium text-text">{target.current}{target.unit ?? ""}</span></span>
        <span>Hedef: <span className="font-medium text-text">{target.goal}{target.unit ?? ""}</span></span>
      </div>
    </div>
  );
}

export function ImprovementPlanWidget({ riotAccountId }: ImprovementPlanWidgetProps) {
  const { data: plan, isLoading } = useImprovementPlan(riotAccountId);
  const generate = useGeneratePlan(riotAccountId);

  if (isLoading) {
    return <div className="h-36 animate-pulse rounded-2xl border border-border bg-surface" />;
  }

  if (!plan) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 text-center">
        {/* Ryze splash — scholar/learning theme */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={championSplashUrl("Ryze")} alt="" aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[70%_20%] opacity-[0.13]"
          style={{ filter: "blur(3px) saturate(0.4)" }} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/85 to-surface/60" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-48 w-64 rounded-full bg-accent/10 blur-3xl" />
        </div>
        <div className="relative">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/20 bg-accent/10">
            <Sparkles className="h-6 w-6 text-accent" />
          </div>
          <p className="mb-1 text-base font-bold text-text">Gelişim Planını Başlat</p>
          <p className="mx-auto mb-5 max-w-xs text-xs leading-relaxed text-text-muted">
            Performansına özel 2 haftalık plan — mevcut verilerine göre günlük hedefler oluşturulur.
          </p>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="rounded-xl bg-accent px-6 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {generate.isPending ? "Oluşturuluyor…" : "Planımı Oluştur"}
          </button>
          <p className="mt-3 text-[11px] text-text-muted">
            <Clock className="mb-0.5 mr-0.5 inline h-3 w-3" />
            Ortalama süre: ~10 saniye
          </p>
        </div>
      </div>
    );
  }

  if (plan.status === "expired") {
    return (
      <div className="rounded-2xl border border-border bg-surface p-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-text-muted" />
            <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Gelişim Planı</p>
          </div>
          <span className="rounded-full border border-border bg-surface-2 px-2.5 py-0.5 text-xs text-text-muted">
            Süresi Doldu
          </span>
        </div>
        <div className="mb-5 space-y-4">
          {plan.targets.map((t) => <ProgressBar key={t.metric} target={t} />)}
        </div>
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="w-full rounded-xl border border-accent px-4 py-2.5 text-sm font-semibold text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
        >
          {generate.isPending ? "Oluşturuluyor…" : "Yeni Plan Başlat"}
        </button>
      </div>
    );
  }

  const achievedCount = plan.targets.filter((t) => t.achieved).length;

  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10">
            <TrendingUp className="h-4 w-4 text-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">{plan.weekLabel}</p>
            <p className="text-[11px] text-text-muted">{plan.daysLeft} gün kaldı</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-accent">{achievedCount}/{plan.targets.length}</p>
          <p className="text-[11px] text-text-muted">hedef</p>
        </div>
      </div>

      {plan.allAchieved && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-success/20 bg-success/10 px-3 py-2.5">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          <p className="text-xs font-medium text-success">
            Tüm hedeflere ulaştın! Gelişmeye devam etmek için yeni plan oluştur.
          </p>
        </div>
      )}

      <div className="mb-4 space-y-4">
        {plan.targets.map((t) => <ProgressBar key={t.metric} target={t} />)}
      </div>

      {plan.allAchieved && (
        <button
          onClick={() => generate.mutate()}
          disabled={generate.isPending}
          className="w-full rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {generate.isPending ? "Oluşturuluyor…" : "Yeni Plan Oluştur"}
        </button>
      )}
    </div>
  );
}
