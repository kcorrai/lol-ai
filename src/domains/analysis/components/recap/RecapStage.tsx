"use client";

import Link from "next/link";
import { ArrowRight, Share2, Check } from "lucide-react";
import { ChampionIcon } from "@/components/ui/ChampionIcon";
import type { RecapChapter, RecapTone } from "./recapChapters";

const TONE: Record<RecapTone, string> = {
  good: "text-accent",
  bad: "text-danger",
  neutral: "text-text",
};

function toneClass(tone: RecapTone | undefined): string {
  return TONE[tone ?? "neutral"];
}

/** The data panel on the right: whichever of the two shapes this chapter carries. */
function Panel({ chapter }: { chapter: RecapChapter }): React.ReactElement {
  return (
    <div className="notch-lg overflow-hidden border border-border bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line-1 bg-surface-2 px-5 py-3.5">
        <span className="hud-label text-[10.5px]">{chapter.panelTitle}</span>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-text-faint">
          {chapter.panelMeta}
        </span>
      </div>

      {chapter.champs && (
        <div className="grid gap-px bg-line-1">
          {chapter.champs.map((champion) => (
            <div
              key={champion.name}
              className="grid grid-cols-[34px_minmax(0,1fr)_72px_54px] items-center gap-3.5 bg-surface px-5 py-2.5"
            >
              <ChampionIcon name={champion.name} size={34} />
              <span className="min-w-0">
                <span className="block truncate text-sm text-text">{champion.name}</span>
                <span className="block font-mono text-[10.5px] tracking-[0.1em] text-text-faint">
                  {champion.meta}
                </span>
              </span>
              <span className="h-1 bg-surface-dark">
                <span
                  className={`block h-1 ${champion.tone === "good" ? "bg-accent" : "bg-danger"}`}
                  style={{ width: `${champion.pct}%` }}
                />
              </span>
              <span
                className={`text-right font-mono text-[13px] tabular-nums ${toneClass(champion.tone)}`}
              >
                {champion.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {chapter.list && (
        <div className="grid gap-px bg-line-1">
          {chapter.list.map((item) => (
            <div
              key={item.label}
              className="flex items-center justify-between gap-4 bg-surface px-5 py-3.5"
            >
              <span className="text-sm text-text-body">{item.label}</span>
              <span
                className={`text-right font-mono text-sm tabular-nums ${toneClass(item.tone)} first-letter:uppercase`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="border-t border-line-1 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-text-faint">
        {chapter.panelFoot}
      </div>
    </div>
  );
}

interface RecapStageProps {
  chapter: RecapChapter;
  onShare: () => void;
  copied: boolean;
}

/** One chapter: the narrative on the left, the numbers behind it on the right. */
export function RecapStage({ chapter, onShare, copied }: RecapStageProps): React.ReactElement {
  const cover = chapter.kind === "cover";
  const end = chapter.kind === "end";

  return (
    <div
      // Keyed by the caller so the entrance animation replays on every chapter change.
      className="grid min-h-0 flex-1 items-center gap-8 px-5 motion-safe:animate-[hud-enter_420ms_ease-out] md:px-8 lg:grid-cols-[1.06fr_0.94fr] lg:gap-12"
    >
      <div className="min-w-0">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 bg-accent motion-safe:animate-pulse" aria-hidden />
          <span className="font-mono text-[10.5px] uppercase tracking-label text-accent">
            {`// ${chapter.kicker}`}
          </span>
        </div>

        {chapter.figure && !cover && !end && (
          <div className="glow-text font-mono text-[64px] font-bold tabular-nums leading-[0.86] text-accent md:text-[104px]">
            {chapter.figure}
          </div>
        )}

        <h1
          className={`font-display font-black uppercase tracking-[0.02em] text-text ${
            cover
              ? // Riot IDs run to 16 characters; a fixed 88px would push a long one over the
                // panel beside it, so the cover name is sized against its own column.
                "break-words text-[clamp(34px,7vw,88px)] leading-[0.88]"
              : end
                ? "mt-0 max-w-[14ch] text-[34px] leading-[0.94] md:text-[62px]"
                : "mt-5 max-w-[18ch] text-[26px] font-extrabold leading-[1.06] md:text-[34px]"
          }`}
        >
          {chapter.headline}
        </h1>

        {chapter.body && (
          <p
            className={`text-text-body ${cover ? "mt-5 max-w-[46ch] text-[17px]" : "mt-4 max-w-[52ch] text-[15px]"}`}
          >
            {chapter.body}
          </p>
        )}

        {end && (
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/improvement"
              className="notch-sm flex h-[46px] items-center gap-2 bg-accent px-5 font-mono text-[12px] font-bold uppercase tracking-label text-background transition-opacity hover:opacity-90"
            >
              Build my next plan
              <ArrowRight aria-hidden className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onShare}
              className="notch-sm flex h-[46px] items-center gap-2 border border-border bg-surface px-5 font-mono text-[12px] font-bold uppercase tracking-label text-text transition-colors hover:border-accent/50"
            >
              {copied ? (
                <Check aria-hidden className="h-4 w-4" />
              ) : (
                <Share2 aria-hidden className="h-4 w-4" />
              )}
              {copied ? "Link copied" : "Share recap"}
            </button>
          </div>
        )}
      </div>

      {/* The panel is the evidence for the claim on the left; on a phone the claim comes first. */}
      <div className="hidden min-w-0 lg:block">
        <Panel chapter={chapter} />
      </div>
    </div>
  );
}
