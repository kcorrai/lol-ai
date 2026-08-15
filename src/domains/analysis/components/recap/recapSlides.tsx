"use client";

import Image from "next/image";
import { BarChart2, Trophy, TrendingUp, Zap, MessageCircle } from "lucide-react";
import { RecapSlide } from "./RecapSlide";
import { RecapStats } from "./RecapStats";
import { RecapChampion } from "./RecapChampion";
import { championIconUrl, normalizeChampionKey } from "@/lib/ddragon";
import type { RecapData } from "../../services/recapService";

export const TOTAL_SLIDES = 9;

function splashUrl(name: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizeChampionKey(name)}_0.jpg`;
}

function loadingUrl(name: string) {
  return `https://ddragon.leagueoflegends.com/cdn/img/champion/loading/${normalizeChampionKey(name)}_0.jpg`;
}

export function buildRecapSlides(data: RecapData, gameName: string, active: number): React.ReactNode[] {
  const displayName = gameName.split("#")[0];
  // Defensive fallbacks for backwards-compatible cached data
  const topChampions = data.topChampions?.length ? data.topChampions : [data.topChampion];
  const totalKills = data.totalKills ?? 0;
  const totalDeaths = data.totalDeaths ?? 0;
  const totalAssists = data.totalAssists ?? 0;
  const estimatedHours = data.estimatedHours ?? Math.round(data.totalMatches * 30 / 60);

  return [
    // 0 — Welcome
    <div key={0} className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ${active === 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <Image fill alt="" aria-hidden src={splashUrl(data.topChampion.name)}
        className="object-cover object-top"
        style={{ opacity: 0.35, filter: "saturate(0.7)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/20" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-48 w-64 rounded-full bg-accent/12 blur-3xl" />
      </div>
      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-background/70 to-transparent" />
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">{data.seasonLabel} · Season Recap</p>
        <h1 className="mt-3 font-display text-5xl font-black text-text"
          style={{ textShadow: "0 0 40px rgba(198,255,61,0.35)" }}>
          {displayName}
        </h1>
        <p className="mt-4 text-base text-text-muted">Your season&apos;s story begins here.</p>
        <div className="mt-6 flex items-center gap-1.5 text-[11px] text-text-muted/60">
          <span className="h-px w-8 bg-border" />
          <span>scroll or arrow keys</span>
          <span className="h-px w-8 bg-border" />
        </div>
      </div>
    </div>,

    // 1 — Big Numbers
    <RecapSlide key={1} bgClass="bg-surface" active={active === 1}>
      <p className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-accent">This Season</p>
      <RecapStats
        active={active === 1}
        stats={[
          { label: "Total Matches", value: data.totalMatches, icon: BarChart2 },
          { label: "Win Rate", value: data.winRate, suffix: "%", icon: Trophy, color: data.winRate >= 50 ? "text-success" : "text-danger" },
          { label: "LP Change", value: Math.abs(data.lpDelta), prefix: data.lpDelta > 0 ? "+" : data.lpDelta < 0 ? "-" : "", icon: TrendingUp, color: data.lpDelta >= 0 ? "text-success" : "text-danger" },
          { label: "Best Streak", value: data.bestStreak, suffix: "W", icon: Zap, color: "text-warning" },
        ]}
      />
    </RecapSlide>,

    // 2 — Kill Feed (new)
    <RecapSlide key={2} bgClass="bg-background" active={active === 2}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-32 w-32 rounded-full bg-success/8 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-32 w-32 rounded-full bg-danger/8 blur-3xl" />
      </div>
      <div className="relative">
        <p className="mb-7 text-xs font-semibold uppercase tracking-[0.15em] text-text-muted">This Season on the Rift</p>
        <div className="flex items-center justify-center gap-5">
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-display text-5xl font-black text-success">{totalKills}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Kills</span>
          </div>
          <span className="mb-5 text-3xl font-light text-border">/</span>
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-display text-5xl font-black text-danger">{totalDeaths}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Deaths</span>
          </div>
          <span className="mb-5 text-3xl font-light text-border">/</span>
          <div className="flex flex-col items-center gap-1.5">
            <span className="font-display text-5xl font-black text-warning">{totalAssists}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Assists</span>
          </div>
        </div>
        <div className="mt-8 rounded-2xl border border-border/50 bg-white/[0.03] px-5 py-3">
          <p className="text-sm text-text-muted">
            You&apos;ve spent approximately{" "}
            <span className="font-bold text-text">{estimatedHours} hours</span>{" "}
            on Summoner&apos;s Rift.
          </p>
        </div>
      </div>
    </RecapSlide>,

    // 3 — Top Champion
    <div key={3} className={`absolute inset-0 transition-opacity duration-500 ${active === 3 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <RecapChampion
        championName={data.topChampion.name}
        games={data.topChampion.games}
        winRate={data.topChampion.winRate}
        kda={data.topChampion.kda}
      />
    </div>,

    // 4 — Champion Pool (new)
    <RecapSlide key={4} bgClass="bg-surface" active={active === 4}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
      </div>
      <p className="mb-7 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Your Main Champions</p>
      <div className="flex items-end justify-center gap-3">
        {topChampions.map((c, i) => (
          <div
            key={c.name}
            className="gaming-card flex flex-col items-center gap-2 rounded-2xl p-4 transition-transform"
            style={{
              transform: i === 0 ? "scale(1.12)" : "scale(0.9)",
              opacity: i === 0 ? 1 : 0.7,
              boxShadow: i === 0 ? "0 0 28px rgba(198,255,61,0.15), inset 0 1px 0 rgba(255,255,255,0.06)" : undefined,
            }}
          >
            <Image src={championIconUrl(c.name)} alt={c.name} width={56} height={56}
              className="rounded-xl ring-1 ring-border" style={{ imageRendering: "auto" }} />
            <p className="text-xs font-bold text-text">{c.name}</p>
            <p className={`text-[11px] font-semibold ${c.winRate >= 50 ? "text-success" : "text-danger"}`}>
              {c.winRate}% WR
            </p>
            <p className="text-[10px] text-text-muted">{c.games} matches</p>
          </div>
        ))}
      </div>
    </RecapSlide>,

    // 5 — Rank Journey
    <RecapSlide key={5} bgClass="bg-background" active={active === 5}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-40 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/8 blur-3xl" />
      </div>
      <div className="relative">
        <p className="mb-8 text-xs font-semibold uppercase tracking-[0.15em] text-accent">Your Rank Journey</p>
        <div className="flex items-center justify-center gap-6">
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Start</p>
            <p className="font-display text-2xl font-bold text-text-muted">{data.startRank}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="h-px w-12 bg-gradient-to-r from-border to-accent" />
            <p className={`font-display text-xl font-black ${data.lpDelta >= 0 ? "text-success" : "text-danger"}`}
              style={data.lpDelta >= 0 ? { textShadow: "0 0 16px rgba(74,222,128,0.4)" } : {}}>
              {data.lpDelta > 0 ? "+" : ""}{data.lpDelta} LP
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Now</p>
            <p className="font-display text-2xl font-bold text-accent"
              style={{ textShadow: "0 0 20px rgba(198,255,61,0.35)" }}>
              {data.endRank}
            </p>
          </div>
        </div>
        {data.lpDelta >= 0 ? (
          <p className="mt-8 text-sm text-text-muted">Climbing the ranks. Keep it up.</p>
        ) : (
          <p className="mt-8 text-sm text-text-muted">Every season teaches a lesson. You&apos;ll be stronger next time.</p>
        )}
      </div>
    </RecapSlide>,

    // 6 — Worst Day
    <RecapSlide key={6} bgClass="bg-surface" active={active === 6}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-32 w-32 -translate-x-1/2 rounded-full bg-danger/8 blur-3xl" />
      </div>
      <div className="relative">
        <p className="mb-6 text-xs font-semibold uppercase tracking-[0.15em] text-text-muted/60">But there&apos;s more...</p>
        {data.worstDay ? (
          <>
            <p className="font-display text-3xl font-black text-danger"
              style={{ textShadow: "0 0 20px rgba(239,68,68,0.3)" }}>
              {new Date(data.worstDay.date).toLocaleDateString("en-US", { day: "numeric", month: "long" })}
            </p>
            <p className="mt-3 text-lg text-text-muted">
              <span className="font-bold text-danger">{data.worstDay.losses}</span> losses in a row
            </p>
            <div className="mt-6 rounded-2xl border border-border/50 bg-white/[0.03] px-5 py-3">
              <p className="text-sm italic text-text-muted">&ldquo;But you came back.&rdquo;</p>
            </div>
          </>
        ) : (
          <p className="text-lg font-semibold text-success">No comebacks needed this season — you played solid!</p>
        )}
      </div>
    </RecapSlide>,

    // 7 — AI Coach
    <RecapSlide key={7} bgClass="bg-background" active={active === 7}>
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background to-transparent" />
      </div>
      <div className="relative flex flex-col items-center gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10"
          style={{ boxShadow: "0 0 24px rgba(198,255,61,0.2)" }}>
          <MessageCircle className="h-6 w-6 text-accent" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">AI Coach Feedback</p>
        <div className="gaming-card max-w-xs rounded-2xl p-5 text-left"
          style={{ boxShadow: "0 0 30px rgba(198,255,61,0.08), inset 0 1px 0 rgba(255,255,255,0.05)" }}>
          <p className="mb-2 font-display text-3xl text-accent/60">&ldquo;</p>
          <p className="text-sm leading-relaxed text-text-muted">{data.aiSummary}</p>
          <p className="mt-2 text-right font-display text-3xl text-accent/60">&rdquo;</p>
        </div>
      </div>
    </RecapSlide>,

    // 8 — Next Season
    <div key={8} className={`absolute inset-0 overflow-hidden transition-opacity duration-500 ${active === 8 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <Image fill alt="" aria-hidden src={loadingUrl(data.topChampion.name)}
        className="object-cover object-top"
        style={{ opacity: 0.2, filter: "saturate(0.5) blur(1px)" }} />
      <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/75 to-surface/30" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-40 w-48 rounded-full bg-accent/12 blur-3xl" />
      </div>
      <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-text-muted/60">Next Goal</p>
        <p className="mt-4 font-display text-4xl font-black text-accent"
          style={{ textShadow: "0 0 40px rgba(198,255,61,0.5)" }}>
          {data.nextGoal ?? `Higher than ${data.endRank}`}
        </p>
        <p className="mt-4 text-base text-text-muted">Ready?</p>
        {data.resolvedHabit && (
          <p className="mt-6 text-xs text-text-muted/60">
            This season you broke the <span className="text-accent">{data.resolvedHabit.replace(/_/g, " ")}</span> habit.
          </p>
        )}
      </div>
    </div>,
  ];
}
