"use client";

import Link from "next/link";
import { Trophy, Lock, Share2 } from "lucide-react";
import { useAchievements } from "@/hooks/useAchievements";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import { championSplashUrl } from "@/lib/ddragon";
import { PageSkeleton } from "@/components/layout/PageSkeleton";
import { TIER_COLORS, TIER_LABEL } from "@/types/achievement";
import type { AchievementCatalogEntry } from "@/types/achievement";
import { cn } from "@/lib/utils";

function AchievementCard({
  achievement,
  earned,
  earnedAt,
  gameName,
}: {
  achievement: AchievementCatalogEntry;
  earned: boolean;
  earnedAt?: string;
  gameName?: string;
}) {
  const tierColor = TIER_COLORS[achievement.tier];

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-xl border p-5 text-center transition-all duration-200",
        earned ? "bg-surface hover:scale-[1.02]" : "bg-surface/50 opacity-50"
      )}
      style={earned ? {
        borderColor: `${tierColor}55`,
        boxShadow: `0 0 28px ${tierColor}14, inset 0 1px 0 rgba(255,255,255,0.04)`,
      } : {}}
    >
      {/* Icon */}
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full text-3xl"
        style={
          earned
            ? { background: `${tierColor}22`, border: `2px solid ${tierColor}` }
            : { background: "transparent", border: "2px solid #2A3550" }
        }
      >
        {earned ? achievement.iconSlug : <Lock className="h-6 w-6 text-text-muted" />}
      </div>

      {/* Tier badge */}
      <span
        className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
        style={
          earned
            ? { background: `${tierColor}22`, color: tierColor }
            : { background: "#1A2138", color: "#4A5568" }
        }
      >
        {TIER_LABEL[achievement.tier]}
      </span>

      <div>
        <p className={cn("font-semibold", earned ? "text-text" : "text-text-muted")}>{achievement.name}</p>
        <p className="mt-0.5 text-xs text-text-muted">{achievement.description}</p>
      </div>

      {earned && earnedAt && (
        <p className="text-[10px] text-text-muted">
          {new Date(earnedAt).toLocaleDateString("tr-TR")}
        </p>
      )}

      {earned && gameName && (
        <Link
          href={`/api/achievements/share/${achievement.id}?gameName=${encodeURIComponent(gameName)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-accent hover:underline"
        >
          <Share2 className="h-2.5 w-2.5" />
          Paylaş
        </Link>
      )}
    </div>
  );
}

export default function AchievementsPage() {
  const { data, isLoading } = useAchievements();
  const { data: accounts } = useRiotAccounts();
  const primaryAccount = accounts?.[0];
  const gameName = primaryAccount
    ? `${primaryAccount.gameName}#${primaryAccount.tagLine}`
    : undefined;

  if (isLoading) return <PageSkeleton />;

  const earned = data?.earned ?? [];
  const locked = data?.locked ?? [];

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6">
      {/* Header — cinematic banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={championSplashUrl("Jinx")} alt="" aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-[40%_20%] opacity-[0.2]"
          style={{ filter: "blur(2px) saturate(0.5)" }} />
        <div className="absolute inset-0 bg-gradient-to-r from-surface/95 via-surface/80 to-transparent" />
        <div className="relative flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10">
            <Trophy className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-text">Rozetlerim</h1>
            <p className="text-sm text-text-muted">
              <span className="font-semibold text-accent">{data?.earnedCount ?? 0}</span>
              {" "}/{" "}{data?.total ?? 0} rozet kazanıldı
            </p>
          </div>
        </div>
      </div>

      {/* Earned section */}
      {earned.length > 0 && (
        <section>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
            Kazanılanlar ({earned.length})
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {earned.map((a) => (
              <AchievementCard
                key={a.id}
                achievement={a}
                earned
                earnedAt={a.earnedAt}
                gameName={gameName}
              />
            ))}
          </div>
        </section>
      )}

      {/* Locked section */}
      {locked.length > 0 && (
        <section>
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-text-muted">
            Kilitli ({locked.length})
          </p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {locked.map((a) => (
              <AchievementCard key={a.id} achievement={a} earned={false} />
            ))}
          </div>
        </section>
      )}

      {earned.length === 0 && locked.length === 0 && (
        <p className="text-center text-text-muted">Henüz rozet yok — maç senkronize et!</p>
      )}
    </div>
  );
}
