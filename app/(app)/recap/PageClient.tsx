"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ChevronRight, Copy, Check, Loader2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildRecapSlides, TOTAL_SLIDES } from "@/domains/analysis/components/recap/recapSlides";
import { useGenerateRecap } from "@/hooks/useRecap";
import { useRiotAccounts } from "@/hooks/useRiotAccounts";
import type { RecapData } from "@/domains/analysis/services/recapService";

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

export default function RecapPage() {
  const [slide, setSlide] = useState(0);
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
  const contents = recap ? buildRecapSlides(recap.data, gameName, slide) : [];

  // Without an account the recap is never requested, so `recap` and `error` both stay
  // null — the spinner below would run forever. Ask for the account instead.
  if (!accountsLoading && !primaryAccount) {
    return (
      <div className="flex h-screen items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10">
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
          <p className="text-sm text-text-muted">Preparing season recap…</p>
        </div>
      </div>
    );
  }

  if (error || !recap) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-danger">Recap failed to load. At least 5 ranked matches required.</p>
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
      <div className="flex flex-1 flex-col items-center justify-center gap-8 px-4 py-6">
        <div className="relative h-[420px] w-full max-w-lg rounded-2xl overflow-hidden border border-border/40"
          style={{ boxShadow: "0 0 60px rgba(198,255,61,0.10), 0 30px 60px rgba(0,0,0,0.4)" }}>
          {contents}
        </div>

        {/* Navigation */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={copyLink}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              <span className="ml-1">{copied ? "Copied!" : "Share"}</span>
            </Button>
            {slide < TOTAL_SLIDES - 1 ? (
              <Button size="sm" onClick={next} className="gap-1 font-semibold">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => setSlide(0)}>Return to Start</Button>
            )}
          </div>
          <button
            onClick={prev}
            disabled={slide === 0}
            className="text-xs text-text-muted disabled:opacity-30 hover:text-text"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}
