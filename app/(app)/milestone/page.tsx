"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Flame, Swords, Clock, Trophy } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { rankEmblemUrl, championIconUrl } from "@/lib/ddragon";
import { useMilestone } from "@/hooks/useMilestone";
import { cn } from "@/lib/utils";

const MONTH_NAMES = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

const TIER_COLORS: Record<string, string> = {
  IRON: "text-gray-400", BRONZE: "text-amber-700", SILVER: "text-gray-300",
  GOLD: "text-yellow-400", PLATINUM: "text-teal-400", EMERALD: "text-emerald-400",
  DIAMOND: "text-blue-400", MASTER: "text-purple-400",
  GRANDMASTER: "text-red-400", CHALLENGER: "text-yellow-300",
};

function formatRank(tier: string, division: string, lp: number): string {
  const highElo = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  const tierDisplay = tier.charAt(0) + tier.slice(1).toLowerCase();
  if (highElo.includes(tier)) return `${tierDisplay} ${lp} LP`;
  return `${tierDisplay} ${division} ${lp} LP`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub?: string;
  highlight?: "success" | "danger" | "accent";
}) {
  const valueClass =
    highlight === "success"
      ? "text-success"
      : highlight === "danger"
      ? "text-danger"
      : highlight === "accent"
      ? "text-accent"
      : "text-text";

  return (
    <div className="gaming-card flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2 text-text-muted">
        <Icon className="h-4 w-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className={cn("text-2xl font-bold tabular-nums", valueClass)}>{value}</p>
      {sub && <p className="text-xs text-text-muted">{sub}</p>}
    </div>
  );
}

function RankJourney({
  rankStart,
  rankEnd,
  lpChange,
}: {
  rankStart: { tier: string; division: string; lp: number } | null;
  rankEnd: { tier: string; division: string; lp: number } | null;
  lpChange: number;
}) {
  return (
    <div className="gaming-card p-4">
      <p className="mb-4 text-xs font-bold uppercase tracking-wider text-text-muted">Rütbe Yolculuğu</p>
      <div className="flex items-center gap-4">
        {/* Start */}
        <div className="flex flex-1 flex-col items-center gap-1">
          {rankStart ? (
            <>
              <Image
                src={rankEmblemUrl(rankStart.tier)}
                alt={rankStart.tier}
                width={48}
                height={48}
                unoptimized
                className="opacity-80"
              />
              <p className={cn("text-xs font-semibold", TIER_COLORS[rankStart.tier] ?? "text-text-muted")}>
                {formatRank(rankStart.tier, rankStart.division, rankStart.lp)}
              </p>
              <p className="text-[10px] text-text-muted">Ay başı</p>
            </>
          ) : (
            <p className="text-xs text-text-muted">Veri yok</p>
          )}
        </div>

        {/* Arrow + LP change */}
        <div className="flex flex-col items-center gap-1">
          {lpChange > 0 ? (
            <TrendingUp className="h-5 w-5 text-success" />
          ) : lpChange < 0 ? (
            <TrendingDown className="h-5 w-5 text-danger" />
          ) : (
            <div className="h-5 w-5 rounded-full border border-border" />
          )}
          <span
            className={cn(
              "text-sm font-bold",
              lpChange > 0 ? "text-success" : lpChange < 0 ? "text-danger" : "text-text-muted"
            )}
          >
            {lpChange > 0 ? "+" : ""}{lpChange} LP
          </span>
        </div>

        {/* End */}
        <div className="flex flex-1 flex-col items-center gap-1">
          {rankEnd ? (
            <>
              <Image
                src={rankEmblemUrl(rankEnd.tier)}
                alt={rankEnd.tier}
                width={48}
                height={48}
                unoptimized
                className={lpChange >= 0 ? "opacity-100" : "opacity-60"}
              />
              <p className={cn("text-xs font-semibold", TIER_COLORS[rankEnd.tier] ?? "text-text-muted")}>
                {formatRank(rankEnd.tier, rankEnd.division, rankEnd.lp)}
              </p>
              <p className="text-[10px] text-text-muted">Şu an</p>
            </>
          ) : (
            <p className="text-xs text-text-muted">Veri yok</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChampionRow({
  name,
  games,
  wins,
  winRate,
  avgKda,
  rank,
}: {
  name: string;
  games: number;
  wins: number;
  winRate: number;
  avgKda: number;
  rank: number;
}) {
  const losses = games - wins;
  const wrColor = winRate >= 55 ? "text-success" : winRate < 45 ? "text-danger" : "text-text";

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/4">
      <span className="w-5 text-center text-xs font-bold text-text-muted">{rank}</span>
      <Image
        src={championIconUrl(name)}
        alt={name}
        width={32}
        height={32}
        unoptimized
        className="rounded-md border border-border"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{name}</p>
        <p className="text-xs text-text-muted">
          <span className="text-success">{wins}G</span>{" "}
          <span className="text-danger">{losses}M</span>
          <span className="mx-1 text-border">·</span>
          {games} maç
        </p>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-bold", wrColor)}>%{winRate}</p>
        <p className="text-xs text-text-muted">{avgKda.toFixed(2)} KDA</p>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="gaming-card p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-14" />
          </div>
        ))}
      </div>
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function MilestonePage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  function prev() {
    if (month === 1) { setMonth(12); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }

  function next() {
    const isCurrentOrFuture = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1);
    if (isCurrentOrFuture) return;
    if (month === 12) { setMonth(1); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const isCurrent = year === now.getFullYear() && month === now.getMonth() + 1;
  const { data, isLoading } = useMilestone(year, month);

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <PageHeader
        title="Aylık Milestone"
        subtitle="Bir ayın tam özeti — istatistikler, rütbe yolculuğu, en iyi performanslar"
        action={<Trophy className="h-5 w-5 text-accent" />}
      />

      {/* Month selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={prev}
          className="rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:border-accent/30 hover:text-accent"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2">
          <Calendar className="h-4 w-4 text-accent" />
          <span className="text-sm font-semibold text-text">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          {isCurrent && (
            <span className="rounded-full bg-accent/15 px-1.5 py-0.5 text-[10px] font-bold text-accent">
              Bu Ay
            </span>
          )}
        </div>
        <button
          onClick={next}
          disabled={isCurrent}
          className="rounded-lg border border-border p-1.5 text-text-muted transition-colors hover:border-accent/30 hover:text-accent disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {isLoading ? (
        <LoadingSkeleton />
      ) : !data ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/50 py-16 text-center">
          <Trophy className="mx-auto mb-3 h-10 w-10 text-text-muted/30" />
          <p className="text-sm font-medium text-text">Bu ay için veri yok</p>
          <p className="mt-1 text-xs text-text-muted">
            {MONTH_NAMES[month - 1]} {year} için ranked solo maç bulunamadı.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stat grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={Swords}
              label="Maçlar"
              value={String(data.gamesPlayed)}
              sub={`${data.wins}G · ${data.losses}M`}
              highlight={data.winRate >= 55 ? "success" : data.winRate < 45 ? "danger" : undefined}
            />
            <StatCard
              icon={TrendingUp}
              label="Kazanma Oranı"
              value={`%${data.winRate}`}
              sub="Ranked Solo"
              highlight={data.winRate >= 55 ? "success" : data.winRate < 45 ? "danger" : undefined}
            />
            <StatCard
              icon={Flame}
              label="Ort. KDA"
              value={data.avgKda.toFixed(2)}
              sub={`En iyi: ${data.bestKda.toFixed(2)}`}
              highlight={data.avgKda >= 3 ? "success" : data.avgKda < 2 ? "danger" : undefined}
            />
            <StatCard
              icon={Clock}
              label="Süre"
              value={`${data.estimatedHours}s`}
              sub={`${data.avgCsPerMin.toFixed(1)} CS/dk ort.`}
            />
          </div>

          {/* Best streak */}
          {data.bestWinStreak >= 3 && (
            <div className="gaming-card-accent flex items-center gap-3 px-4 py-3">
              <Flame className="h-5 w-5 shrink-0 text-accent" />
              <div>
                <p className="text-sm font-bold text-text">
                  {data.bestWinStreak} maçlık galibiyet serisi!
                </p>
                <p className="text-xs text-text-muted">Bu aydaki en iyi performans.</p>
              </div>
            </div>
          )}

          {/* Rank journey */}
          <RankJourney
            rankStart={data.rankStart}
            rankEnd={data.rankEnd}
            lpChange={data.lpChange}
          />

          {/* Top champions */}
          <div className="gaming-card p-4">
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">
              Bu Aydaki Şampiyonlar
            </p>
            <div className="space-y-1">
              {data.topChampions.map((champ, i) => (
                <ChampionRow key={champ.name} rank={i + 1} {...champ} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
