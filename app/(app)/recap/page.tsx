"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Copy, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RecapSlide } from "@/domains/analysis/components/recap/RecapSlide";
import { RecapStats } from "@/domains/analysis/components/recap/RecapStats";
import { RecapChampion } from "@/domains/analysis/components/recap/RecapChampion";
import { useGenerateRecap } from "@/hooks/useRecap";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import type { RecapData } from "@/domains/analysis/services/recapService";

const TOTAL_SLIDES = 8;

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= current ? "bg-accent" : "bg-border"}`}
        />
      ))}
    </div>
  );
}

function useRecapSlides(data: RecapData, gameName: string, active: number) {
  const slides = [
    { label: "Karşılama", bg: "bg-background" },
    { label: "Büyük Sayılar", bg: "bg-surface" },
    { label: "En İyi Şampiyon", bg: "bg-background" },
    { label: "Rank Yolculuğu", bg: "bg-surface" },
    { label: "En Kötü Gün", bg: "bg-background" },
    { label: "Alışkanlık", bg: "bg-surface" },
    { label: "AI Koç Yorumu", bg: "bg-background" },
    { label: "Sıradaki Sezon", bg: "bg-surface" },
  ];

  const contents = [
    // Slide 0 — Welcome
    <RecapSlide key={0} bgClass={slides[0].bg} active={active === 0}>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">{data.seasonLabel}</p>
      <h1 className="mt-3 font-display text-4xl font-black text-text">{gameName}</h1>
      <p className="mt-4 max-w-xs text-lg text-text-muted">Bu sezon sahada geçirdiğin zamana değdi mi?</p>
    </RecapSlide>,

    // Slide 1 — Big Numbers
    <RecapSlide key={1} bgClass={slides[1].bg} active={active === 1}>
      <p className="mb-8 text-xs font-semibold uppercase tracking-widest text-accent">Büyük Sayılar</p>
      <RecapStats
        active={active === 1}
        stats={[
          { label: "Toplam Maç", value: data.totalMatches },
          { label: "Kazanma Oranı", value: data.winRate, suffix: "%" },
          { label: "LP Değişimi", value: data.lpDelta, prefix: data.lpDelta > 0 ? "+" : "" },
          { label: "En Uzun Seri", value: data.bestStreak, suffix: "W" },
        ]}
      />
    </RecapSlide>,

    // Slide 2 — Top Champion
    <div key={2} className={`h-full w-full transition-opacity duration-500 ${active === 2 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
      <RecapChampion
        championName={data.topChampion.name}
        games={data.topChampion.games}
        winRate={data.topChampion.winRate}
        kda={data.topChampion.kda}
      />
    </div>,

    // Slide 3 — Rank Journey
    <RecapSlide key={3} bgClass={slides[3].bg} active={active === 3}>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">Rank Yolculuğu</p>
      <div className="mt-8 space-y-4">
        <div>
          <p className="text-xs text-text-muted">Başladığın yer</p>
          <p className="font-display text-3xl font-bold text-text">{data.startRank}</p>
        </div>
        <p className="text-2xl text-text-muted">↓</p>
        <div>
          <p className="text-xs text-text-muted">Bitirdiğin yer</p>
          <p className="font-display text-3xl font-bold text-accent">{data.endRank}</p>
        </div>
        <p className="mt-4 text-sm text-text-muted">
          {data.lpDelta > 0 ? "+" : ""}{data.lpDelta} LP değişimi
        </p>
      </div>
    </RecapSlide>,

    // Slide 4 — Worst Day
    <RecapSlide key={4} bgClass={slides[4].bg} active={active === 4}>
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Bir de bunlar vardı...</p>
      {data.worstDay ? (
        <>
          <p className="mt-6 font-display text-2xl font-bold text-danger">
            {new Date(data.worstDay.date).toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
          </p>
          <p className="mt-2 text-lg text-text-muted">{data.worstDay.losses} üst üste kayıp</p>
          <p className="mt-6 text-sm text-text-muted italic">&ldquo;Ama geri döndün.&rdquo;</p>
        </>
      ) : (
        <p className="mt-6 text-lg text-text">Bu sezon çok sağlam oynadın!</p>
      )}
    </RecapSlide>,

    // Slide 5 — Habit
    <RecapSlide key={5} bgClass={slides[5].bg} active={active === 5}>
      {data.resolvedHabit ? (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Alışkanlık Kırma</p>
          <p className="mt-6 font-display text-2xl font-bold text-text">Bu sezon bir alışkanlığı yendin</p>
          <p className="mt-3 text-text-muted">{data.resolvedHabit.replace(/_/g, " ")}</p>
          <p className="mt-6 text-3xl">🔗</p>
        </>
      ) : (
        <>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Devam Et</p>
          <p className="mt-6 font-display text-2xl font-bold text-text">Gelişim sürüyor</p>
          <p className="mt-3 text-text-muted">Bir sonraki sezonda alışkanlıklarını kır.</p>
        </>
      )}
    </RecapSlide>,

    // Slide 6 — AI Coach
    <RecapSlide key={6} bgClass={slides[6].bg} active={active === 6}>
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">AI Koç Yorumu</p>
      <div className="mt-6 max-w-sm rounded-xl border border-border bg-surface-2 p-5 text-left text-sm leading-relaxed text-text-muted">
        <p className="italic">&ldquo;{data.aiSummary}&rdquo;</p>
      </div>
    </RecapSlide>,

    // Slide 7 — Next Season
    <RecapSlide key={7} bgClass={slides[7].bg} active={active === 7}>
      <p className="text-xs font-semibold uppercase tracking-widest text-text-muted">Sıradaki Hedef</p>
      {data.nextGoal ? (
        <p className="mt-6 font-display text-3xl font-bold text-accent">{data.nextGoal}</p>
      ) : (
        <p className="mt-6 font-display text-3xl font-bold text-text">{data.endRank}{"'"}dan daha yükseğe</p>
      )}
      <p className="mt-4 text-sm text-text-muted">Hazır mısın?</p>
    </RecapSlide>,
  ];

  return { contents, slides };
}

export default function RecapPage() {
  const [slide, setSlide] = useState(0);
  const [recap, setRecap] = useState<{ data: RecapData; shareToken: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: accounts } = useRiotAccounts();
  const { mutate: generate, isPending, error } = useGenerateRecap();
  const primaryAccount = accounts?.[0];

  useEffect(() => {
    if (!primaryAccount) return;
    generate(
      { riotAccountId: primaryAccount.id },
      { onSuccess: (r) => setRecap({ data: r.data, shareToken: r.shareToken }) }
    );
  }, [primaryAccount, generate]);

  const prev = useCallback(() => setSlide((s) => Math.max(0, s - 1)), []);
  const next = useCallback(() => setSlide((s) => Math.min(TOTAL_SLIDES - 1, s + 1)), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [next, prev]);

  async function copyLink() {
    if (!recap) return;
    await navigator.clipboard.writeText(`${window.location.origin}/recap/share/${recap.shareToken}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const gameName = primaryAccount ? `${primaryAccount.gameName}#${primaryAccount.tagLine}` : "Summoner";

  const { contents } = recap ? useRecapSlides(recap.data, gameName, slide) : { contents: [] }; // eslint-disable-line react-hooks/rules-of-hooks

  if (isPending || (!recap && !error)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="text-sm text-text-muted">Recap hazırlanıyor…</p>
        </div>
      </div>
    );
  }

  if (error || !recap) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-danger">Recap yüklenemedi. En az 5 ranked maç gerekli.</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Progress bar */}
      <div className="shrink-0 px-6 pt-4">
        <ProgressBar current={slide} total={TOTAL_SLIDES} />
      </div>

      {/* Slide area */}
      <div className="relative min-h-0 flex-1">
        {contents}
      </div>

      {/* Navigation */}
      <div className="shrink-0 flex items-center justify-between px-6 pb-6 pt-3">
        <Button variant="secondary" size="sm" onClick={prev} disabled={slide === 0}>
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <Button variant="secondary" size="sm" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="ml-1.5">{copied ? "Kopyalandı!" : "Paylaş"}</span>
        </Button>

        {slide < TOTAL_SLIDES - 1 ? (
          <Button size="sm" onClick={next}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button size="sm" onClick={() => setSlide(0)}>Başa Dön</Button>
        )}
      </div>
    </div>
  );
}
