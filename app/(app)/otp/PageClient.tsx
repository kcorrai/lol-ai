"use client";

import { useState } from "react";
import { Target, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { ChampionSelector } from "@/components/shared/ChampionSelector";
import { MetaRating } from "@/domains/otp/components/MetaRating";
import { MatchupTierList } from "@/domains/otp/components/MatchupTierList";
import { BanPriority } from "@/domains/otp/components/BanPriority";
import { OtpTips } from "@/domains/otp/components/OtpTips";
import { OtpSkeleton } from "@/domains/otp/components/OtpSkeleton";
import { RecommendedOtps } from "@/domains/otp/components/RecommendedOtps";
import { useOtpAssistant } from "@/hooks/useOtpAssistant";
import { useSubscription } from "@/hooks/useSubscription";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { useOtpRecommendations } from "@/hooks/useOtpRecommendations";
import { cn } from "@/lib/utils";
import type { Position } from "@/types/common.types";

const ROLES: { value: Position; label: string }[] = [
  { value: "TOP", label: "Top" },
  { value: "JUNGLE", label: "JGL" },
  { value: "MIDDLE", label: "Mid" },
  { value: "BOTTOM", label: "ADC" },
  { value: "UTILITY", label: "Sup" },
];

export default function OtpPage() {
  const [champion, setChampion] = useState<string | null>(null);
  const [role, setRole] = useState<Position | null>(null);

  const { data, isLoading, isError, error } = useOtpAssistant(champion, role);
  const { data: subscription } = useSubscription();
  const { data: accounts } = useRiotAccounts();
  const { data: recs } = useOtpRecommendations(accounts?.[0]?.id);

  const isPro = subscription?.plan === "pro" || subscription?.plan === "elite";

  const showEmpty = !champion || !role;

  return (
    <div className="mx-auto max-w-3xl p-6">
      <PageHeader
        title="OTP Assistant"
        subtitle="Everything you need to master a single champion."
      />

      {/* Data-driven picks from the user's own ranked stats (TASK-235) */}
      {recs?.recommendations && (
        <RecommendedOtps
          recommendations={recs.recommendations}
          onSelect={(champ, pos) => {
            setChampion(champ);
            setRole(pos);
          }}
        />
      )}

      {/* Inputs */}
      <div className="mb-6 space-y-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Your Champion</label>
          <ChampionSelector value={champion} onChange={setChampion} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-muted">Role</label>
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                  role === r.value
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface text-text-muted hover:border-accent/40 hover:text-text"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* States */}
      {showEmpty && (
        <EmptyState
          icon={<Target className="h-14 w-14" />}
          title="Select champion and role"
          description="Analysis starts automatically."
        />
      )}

      {!showEmpty && isLoading && <OtpSkeleton />}

      {!showEmpty && isError && (
        <ErrorState
          title="Analysis failed to load"
          message={error?.message ?? "Please try again."}
        />
      )}

      {data && !isLoading && (
        <div className="space-y-4">
          <MetaRating rating={data.metaRating} />
          <MatchupTierList tierList={data.matchupTierList} />
          <BanPriority bans={data.banPriority} />
          <OtpTips
            powerSpikes={data.powerSpikes}
            laneStrategies={data.laneStrategies}
            hiddenMechanics={data.hiddenMechanics}
            isPro={isPro}
          />

          <div className="flex items-start gap-2 rounded-lg border border-border bg-surface px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-text-muted/60" />
            <p className="text-xs text-text-muted">
              This analysis is AI-generated. Information may differ from the current patch.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
