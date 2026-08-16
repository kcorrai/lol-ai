"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Loader2, Share2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildRecapChapters } from "@/domains/analysis/components/recap/recapChapters";
import { RecapStage } from "@/domains/analysis/components/recap/RecapStage";
import { championSplashUrl } from "@/lib/ddragon";
import { useGenerateRecap } from "@/hooks/useRecap";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import type { RecapData } from "@/domains/analysis/services/recapService";

// A wheel gesture fires dozens of events; one chapter per gesture, not per event.
const WHEEL_COOLDOWN_MS = 700;
const WHEEL_THRESHOLD = 24;

export default function RecapPage(): React.ReactElement {
  const [index, setIndex] = useState(0);
  const [recap, setRecap] = useState<{ data: RecapData; shareToken: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const { data: accounts, isLoading: accountsLoading } = useRiotAccounts();
  const { mutate: generate, isPending, error } = useGenerateRecap();
  const primaryAccount = accounts?.[0];

  useEffect(() => {
    if (!primaryAccount) return;
    generate(
      { riotAccountId: primaryAccount.id },
      { onSuccess: (r) => setRecap({ data: r.data, shareToken: r.shareToken }) }
    );
  }, [primaryAccount, generate]);

  const gameName = primaryAccount
    ? `${primaryAccount.gameName}#${primaryAccount.tagLine}`
    : "Summoner";
  const chapters = useMemo(
    () => (recap ? buildRecapChapters(recap.data, gameName) : []),
    [recap, gameName]
  );
  const total = chapters.length;

  const prev = useCallback(() => setIndex((i) => Math.max(0, i - 1)), []);
  const next = useCallback(() => setIndex((i) => Math.min(total - 1, i + 1)), [total]);

  useEffect(() => {
    if (total === 0) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        next();
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    let last = 0;
    const onWheel = (e: WheelEvent): void => {
      const now = Date.now();
      if (now - last < WHEEL_COOLDOWN_MS || Math.abs(e.deltaY) < WHEEL_THRESHOLD) return;
      last = now;
      if (e.deltaY > 0) next();
      else prev();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
    };
  }, [next, prev, total]);

  const copyLink = useCallback(async (): Promise<void> => {
    if (!recap) return;
    await navigator.clipboard.writeText(
      `${window.location.origin}/recap/share/${recap.shareToken}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [recap]);

  // Without an account the recap is never requested, so `recap` and `error` both stay null —
  // the spinner below would run forever. Ask for the account instead.
  if (!accountsLoading && !primaryAccount) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="notch w-full max-w-md border border-border bg-surface p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center bg-accent/10">
            <Trophy className="h-6 w-6 text-accent" />
          </div>
          <h1 className="mt-5 font-display text-2xl font-bold text-text">
            Connect your Riot account
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-text-muted">
            Your season recap is built from your ranked games. Link your Riot ID and we&apos;ll put
            it together — it needs at least 5 ranked matches.
          </p>
          <div className="mt-8">
            <Link href="/settings/accounts">
              <Button size="lg">Connect Riot Account</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isPending || (!recap && !error)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
          <p className="hud-label">Preparing season recap…</p>
        </div>
      </div>
    );
  }

  if (error || !recap || total === 0) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <p className="text-sm text-danger">
          Recap failed to load. At least 5 ranked matches required.
        </p>
      </div>
    );
  }

  const chapter = chapters[index];

  return (
    // The deck fills the viewport under the app shell's 3.5rem top bar. A plain `h-screen` here
    // would push the shell past the viewport and put a scrollbar on a page that never scrolls.
    <div className="relative flex h-[calc(100dvh-3.5rem)] min-h-[560px] flex-col overflow-hidden bg-background">
      {/* Art is bound to the chapter, so the ground moves with the story. */}
      <Image
        key={chapter.art}
        src={championSplashUrl(chapter.art)}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-[62%_22%] opacity-40 [filter:grayscale(0.3)_contrast(1.08)]"
        unoptimized
      />
      <div className="absolute inset-0 bg-gradient-to-r from-surface-dark from-[22%] via-[rgba(6,10,9,0.62)] via-[62%] to-[rgba(6,10,9,0.30)]" />
      <div className="bg-scanline absolute inset-0" />
      <div className="bg-hero-fade absolute inset-0" />

      <div className="relative flex gap-1.5 px-5 pt-3.5 md:px-8">
        {chapters.map((c, i) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setIndex(i)}
            title={c.kicker}
            aria-label={`Go to ${c.kicker}`}
            aria-current={i === index ? "step" : undefined}
            className="h-[3px] flex-1 bg-surface-2"
          >
            <span
              className={`block h-[3px] transition-[width] duration-500 ${i <= index ? "bg-accent" : ""} ${i === index ? "glow-accent-soft" : ""}`}
              style={{ width: i <= index ? "100%" : "0%" }}
            />
          </button>
        ))}
      </div>

      <div className="relative flex flex-wrap items-center gap-3 px-5 pt-3.5 md:px-8">
        <span className="font-display text-[15px] font-extrabold uppercase tracking-[0.06em] text-text">
          LOL AI <span className="text-accent">COACH</span>
        </span>
        <span className="h-3.5 w-px bg-line-2" />
        <span className="hud-label truncate text-[10.5px]">
          {recap.data.seasonLabel} · season recap · {gameName}
        </span>
        <span className="ml-auto font-mono text-[10.5px] uppercase tracking-label text-text-faint">
          {index + 1} / {total}
        </span>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center overflow-y-auto py-4">
        <RecapStage key={chapter.id} chapter={chapter} onShare={copyLink} copied={copied} />
      </div>

      <div className="relative flex flex-wrap items-center gap-3 px-5 pb-5 md:px-8">
        <button
          type="button"
          onClick={prev}
          disabled={index === 0}
          className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-label text-text-body transition-colors hover:text-text disabled:opacity-30"
        >
          <ArrowLeft aria-hidden className="h-3.5 w-3.5" />
          Back
        </button>

        <div className="hidden items-center gap-3.5 overflow-hidden lg:flex">
          {chapters.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setIndex(i)}
              className={`border-b py-1 font-mono text-[10px] uppercase tracking-label transition-colors ${
                i === index
                  ? "border-accent text-accent"
                  : "border-transparent text-text-faint hover:text-text-body"
              }`}
            >
              {c.kicker}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="hidden font-mono text-[10px] uppercase tracking-label text-text-faint sm:inline">
            ← → or scroll
          </span>
          <button
            type="button"
            onClick={copyLink}
            className="notch-sm flex h-[34px] items-center gap-1.5 border border-border bg-surface px-3.5 font-mono text-[11px] uppercase tracking-label text-text transition-colors hover:border-accent/50"
          >
            {copied ? (
              <Check aria-hidden className="h-3.5 w-3.5" />
            ) : (
              <Share2 aria-hidden className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied" : "Share"}
          </button>
          <button
            type="button"
            onClick={() => (index === total - 1 ? setIndex(0) : next())}
            className="notch-sm flex h-[34px] items-center gap-1.5 bg-accent px-3.5 font-mono text-[11px] font-bold uppercase tracking-label text-background transition-opacity hover:opacity-90"
          >
            {index === total - 1 ? "Restart" : "Continue"}
            <ArrowRight aria-hidden className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
