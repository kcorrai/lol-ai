"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { profileIconUrl, championSplashUrl } from "@/lib/ddragon";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { PerformanceSummaryCards } from "@/domains/analysis/components/PerformanceSummaryCards";
import { RecentMatchesSummaryCard } from "@/domains/analysis/components/RecentMatchesSummaryCard";
import { PerformanceTrendChart } from "@/domains/analysis/components/PerformanceTrendChart";
import { RecentMatchList } from "@/domains/analysis/components/RecentMatchList";
import { TiltWidget } from "@/domains/analysis/components/TiltWidget";
import { TiltBreakModal } from "@/domains/analysis/components/TiltBreakModal";
import { WarmupWidget } from "@/domains/analysis/components/WarmupWidget";
import { SessionReadinessWidget } from "@/domains/analysis/components/SessionReadinessWidget";
import { TodaysFocusCard } from "@/domains/analysis/components/TodaysFocusCard";
import { LastGameInsightCard } from "@/domains/analysis/components/LastGameInsightCard";
import { ImprovementPlanWidget } from "@/domains/analysis/components/ImprovementPlanWidget";
import { WinrateTrendWidget } from "@/domains/analysis/components/WinrateTrendWidget";
import { TopChampionsWidget } from "@/domains/analysis/components/TopChampionsWidget";
import { RoleDistributionWidget } from "@/domains/analysis/components/RoleDistributionWidget";
import { HabitDetectionCard } from "@/domains/analysis/components/HabitDetectionWidget";
import { PatchImpactWidget } from "@/components/dashboard/PatchImpactWidget";
import { DailyChallengeWidget } from "@/components/dashboard/DailyChallengeWidget";
import { XpLevelWidget } from "@/components/dashboard/XpLevelWidget";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { usePerformanceProfile } from "@/hooks/usePerformanceProfile";
import { useSubscription } from "@/hooks/useSubscription";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-medium uppercase tracking-widest text-text-muted">
      {children}
    </p>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  useEffect(() => {
    if (!accountsLoading && accounts && accounts.length === 0) {
      router.replace("/onboarding");
    }
  }, [accountsLoading, accounts, router]);

  const primaryId = selectedAccountId ?? accounts?.[0]?.id ?? null;
  const primaryAccount = accounts?.find((a) => a.id === primaryId);

  const { data: profile, isLoading: profileLoading, error: profileError } = usePerformanceProfile(primaryId);
  const { data: sub } = useSubscription();

  if (accountsLoading || !accounts || accounts.length === 0) return <PageSkeleton />;

  const isPro = sub?.plan === "pro" || sub?.plan === "elite";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <TiltBreakModal riotAccountId={primaryId} />

      {/* ── Player Header — cinematic banner ──────────────────────────── */}
      {(() => {
        const featuredChamp = profile?.recentMatches?.[0]?.champion ?? null;
        return (
          <div className="relative overflow-hidden rounded-2xl border border-border">
            {featuredChamp && (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={championSplashUrl(featuredChamp)} alt="" aria-hidden
                  className="absolute inset-0 h-full w-full object-cover object-[60%_15%] opacity-[0.18]"
                  style={{ filter: "blur(2px) saturate(0.55)" }} />
                <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/75 to-transparent" />
              </>
            )}
            <div className="relative flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-4">
                {primaryAccount && (
                  <div className="relative shrink-0">
                    <Image src={profileIconUrl(primaryAccount.profileIconId)} alt={primaryAccount.gameName}
                      width={72} height={72} unoptimized
                      className="rounded-full border-2 border-accent/30 shadow-[0_0_16px_rgba(200,155,60,0.25)]" />
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-surface px-1.5 py-0.5 text-[10px] font-bold text-text-muted ring-1 ring-border">
                      {primaryAccount.summonerLevel}
                    </span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="font-display text-2xl font-bold text-text">
                      {primaryAccount
                        ? <>{primaryAccount.gameName}<span className="text-text-muted/70">#{primaryAccount.tagLine}</span></>
                        : "Dashboard"}
                    </h1>
                    <Badge variant={isPro ? "success" : "secondary"} className="text-xs">{isPro ? "Pro" : "Free"}</Badge>
                  </div>
                  {primaryAccount && (
                    <p className="text-sm text-text-muted">
                      {primaryAccount.region.toUpperCase()}
                      {accounts.length > 1 && (
                        <select className="ml-2 rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-text"
                          value={primaryId ?? ""} onChange={(e) => setSelectedAccountId(e.target.value)}>
                          {accounts.map((a) => (
                            <option key={a.id} value={a.id}>{a.gameName}#{a.tagLine}</option>
                          ))}
                        </select>
                      )}
                    </p>
                  )}
                </div>
              </div>
              <Link href="/coaching/chat">
                <Button size="sm" className="gap-1.5"><MessageCircle className="h-4 w-4" />Koçuna Sor</Button>
              </Link>
            </div>
          </div>
        );
      })()}

      {profileError ? (
        <EmptyState
          title="Henüz maç verisi yok"
          description="Riot hesabını senkronize ederek maç geçmişini yükle ve koçluk önerileri al."
          action={<Link href="/settings/accounts"><Button variant="secondary" size="sm">Hesabı Senkronize Et</Button></Link>}
        />
      ) : (
        <>
          {/* ── Top summary ────────────────────────────────────────────── */}
          <PerformanceSummaryCards profile={profile} isLoading={profileLoading} />
          <RecentMatchesSummaryCard profile={profile} isLoading={profileLoading} />

          {/* ── Today's Brief ──────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <TodaysFocusCard riotAccountId={primaryId} />
            <SessionReadinessWidget riotAccountId={primaryId} />
          </div>

          {/* ── Main 2-column layout ───────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="space-y-4 lg:col-span-2">
              <div>
                <SectionLabel>En İyi Şampiyonlar</SectionLabel>
                <TopChampionsWidget matches={profile?.recentMatches} isLoading={profileLoading} />
              </div>
              <div>
                <SectionLabel>Roller</SectionLabel>
                <RoleDistributionWidget matches={profile?.recentMatches} isLoading={profileLoading} />
              </div>
              <div>
                <SectionLabel>Mental Durum</SectionLabel>
                <div className="space-y-3">
                  <TiltWidget riotAccountId={primaryId} />
                  <WarmupWidget riotAccountId={primaryId} />
                </div>
              </div>
              <div>
                <SectionLabel>Alışkanlıklar</SectionLabel>
                <HabitDetectionCard riotAccountId={primaryId} />
              </div>
              <div>
                <SectionLabel>Yama Etkisi</SectionLabel>
                <PatchImpactWidget riotAccountId={primaryId} />
              </div>
              <div>
                <SectionLabel>Günlük Görevler</SectionLabel>
                <div className="space-y-3">
                  <XpLevelWidget />
                  <DailyChallengeWidget />
                </div>
              </div>
            </div>
            <div className="space-y-4 lg:col-span-3">
              <LastGameInsightCard match={profile?.recentMatches[0]} isLoading={profileLoading} />
              <ImprovementPlanWidget riotAccountId={primaryId} />
              <WinrateTrendWidget matches={profile?.recentMatches} isLoading={profileLoading} />
              <PerformanceTrendChart matches={profile?.recentMatches} isLoading={profileLoading} />
            </div>
          </div>

          {/* ── Recent Matches ─────────────────────────────────────────── */}
          <section>
            <SectionLabel>Son Maçlar</SectionLabel>
            <RecentMatchList matches={profile?.recentMatches} isLoading={profileLoading} />
          </section>
        </>
      )}
    </div>
  );
}
