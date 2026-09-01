"use client";

import Image from "next/image";
import { MonitorPlay, Radio, ShieldCheck, Terminal, type LucideIcon } from "lucide-react";
import { championSplashUrl } from "@/lib/ddragon";

// What the kit is, shown rather than described.
//
// The three sample cards are the argument: a creator deciding whether to turn
// this on wants to know what lands on their canvas, and a bulleted list of
// features cannot answer that.

const ART_CHAMPION = "Jinx";

interface Pitch {
  icon: LucideIcon;
  title: string;
  body: string;
}

const PITCH: Pitch[] = [
  {
    icon: MonitorPlay,
    title: "Five browser sources",
    body: "Paste a URL into OBS. Nothing to install, transparent background, no chroma key.",
  },
  {
    icon: Terminal,
    title: "Five chat commands",
    body: "!rank, !session and three more, working with the bot you already run.",
  },
  {
    icon: ShieldCheck,
    title: "Stream-safe by default",
    body: "Hide your Riot ID and match a broadcast delay, so the overlay cannot give away that a game just ended.",
  },
];

interface Teaser {
  kicker: string;
  big: string;
  suffix: string;
  suffixClass: string;
  sub: string;
  subClass: string;
}

const TEASERS: Teaser[] = [
  {
    kicker: "kaanproak0#TR1",
    big: "Silver II",
    suffix: "84 LP",
    suffixClass: "text-accent",
    sub: "+46 LP this session",
    subClass: "text-accent",
  },
  {
    kicker: "Session",
    big: "4W · 2L",
    suffix: "67%",
    suffixClass: "text-accent",
    sub: "41/28/63 · 3.71 KDA",
    subClass: "text-fg-2",
  },
  {
    kicker: "Last game · ranked solo",
    big: "Swain",
    suffix: "LOSS",
    suffixClass: "text-danger",
    sub: "0/4/1 · 1.1 CS/min · 7:33",
    subClass: "text-fg-2",
  },
];

export function CreatorIntro({
  onEnable,
  enabling,
}: {
  onEnable: () => void;
  enabling: boolean;
}): JSX.Element {
  return (
    <div className="relative overflow-hidden">
      <Image
        src={championSplashUrl(ART_CHAMPION)}
        alt=""
        aria-hidden
        fill
        priority
        sizes="100vw"
        className="object-cover object-[56%_20%] opacity-[0.15] contrast-[1.1] grayscale-[0.5]"
      />
      <span
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-background from-[18%] to-[rgba(8,11,10,.76)] to-[76%]"
      />
      <span aria-hidden className="bg-scanline absolute inset-0" />

      <div className="relative mx-auto grid max-w-[1240px] items-center gap-12 px-6 py-11 lg:grid-cols-[minmax(0,1fr)_520px] lg:px-10">
        <div>
          <p className="flex items-center gap-2.5">
            <span className="h-[7px] w-[7px] animate-glow-pulse bg-accent" />
            <span className="font-mono text-[10.5px] uppercase tracking-label text-accent">
              {"// Free on every plan"}
            </span>
          </p>
          <h1 className="mt-5 max-w-[16ch] font-display text-[46px] font-black uppercase leading-[0.98] text-text">
            Your rank on stream, without a plugin
          </h1>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-text-body">
            Overlays for OBS and chat commands for Twitch, Kick and YouTube, built from your ranked
            history. Nothing reads your live game, so none of it can break Riot&apos;s rules.
          </p>

          <ul className="mt-7 grid max-w-[56ch] gap-px border border-line-1 bg-line-1">
            {PITCH.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="grid grid-cols-[34px_1fr] items-start gap-3.5 bg-ink-1000/[0.86] px-[18px] py-4"
              >
                <Icon className="mt-px h-[18px] w-[18px] text-accent" />
                <span>
                  <span className="block font-display text-sm font-bold uppercase tracking-wider text-text">
                    {title}
                  </span>
                  <span className="mt-1.5 block text-[13.5px] leading-relaxed text-text-body">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onEnable}
            disabled={enabling}
            className="tag-cut btn-glow mt-7 flex items-center gap-2.5 bg-accent px-6 py-3 font-display text-[13px] font-bold uppercase tracking-wider text-ink-1000 transition-all disabled:opacity-50"
          >
            <Radio className="h-4 w-4" />
            {enabling ? "Setting up…" : "Turn on creator mode"}
          </button>
        </div>

        <div>
          <p className="hud-label mb-3.5">{"// The five overlays"}</p>
          <div className="grid gap-3">
            {TEASERS.map((teaser) => (
              <div
                key={teaser.kicker}
                className="tag-cut relative overflow-hidden border border-line-1 bg-ink-1000 px-[18px] py-4"
              >
                <span
                  aria-hidden
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(45deg, rgba(233,245,238,.045) 25%, transparent 25%, transparent 75%, rgba(233,245,238,.045) 75%), linear-gradient(45deg, rgba(233,245,238,.045) 25%, transparent 25%, transparent 75%, rgba(233,245,238,.045) 75%)",
                    backgroundSize: "18px 18px",
                    backgroundPosition: "0 0, 9px 9px",
                  }}
                />
                <span className="tag-cut relative block border border-[rgba(198,255,61,.22)] bg-[rgba(8,11,10,.88)] px-4 py-3.5">
                  <span className="font-mono text-[10px] uppercase tracking-label text-fg-3">
                    {teaser.kicker}
                  </span>
                  <span className="mt-1.5 block">
                    <span className="font-display text-2xl font-extrabold text-fg-1">
                      {teaser.big}
                    </span>
                    <span className={`ml-2.5 font-mono text-lg font-bold ${teaser.suffixClass}`}>
                      {teaser.suffix}
                    </span>
                  </span>
                  <span className={`mt-1.5 block font-mono text-[13px] ${teaser.subClass}`}>
                    {teaser.sub}
                  </span>
                  <span className="mt-2 block font-mono text-[10px] uppercase tracking-label text-fg-3">
                    laneiq.gg
                  </span>
                </span>
              </div>
            ))}
          </div>
          <p className="mt-3 text-right font-mono text-[9.5px] uppercase tracking-label text-text-faint">
            Transparent background · drops straight into OBS
          </p>
        </div>
      </div>
    </div>
  );
}
