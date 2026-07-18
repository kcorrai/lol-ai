"use client";

import Image from "next/image";
import { normalizeChampionKey } from "@/lib/ddragon";

const SPLASH_URL = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${normalizeChampionKey(name)}_0.jpg`;

interface Props {
  championName: string;
  games: number;
  winRate: number;
  kda: number;
}

export function RecapChampion({ championName, games, winRate, kda }: Props) {
  const kdaColor = kda >= 4 ? "text-success" : kda >= 3 ? "text-warning" : "text-text";
  const wrColor = winRate >= 55 ? "text-success" : winRate >= 50 ? "text-accent" : "text-text";

  return (
    <div className="relative flex h-full w-full flex-col items-center justify-end pb-10">
      <Image
        src={SPLASH_URL(championName)}
        alt={championName}
        fill
        unoptimized
        className="object-cover object-top"
        style={{ opacity: 0.45 }}
      />
      {/* Gradient vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-background/60 to-transparent" />
      {/* Glow behind champion name */}
      <div className="pointer-events-none absolute inset-x-0 bottom-24 flex justify-center">
        <div className="h-20 w-48 rounded-full bg-accent/15 blur-3xl" />
      </div>

      {/* Stats overlay */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-accent">Season Star</p>
        <h2
          className="font-display text-5xl font-black text-text"
          style={{ textShadow: "0 0 40px rgba(200,155,60,0.4)" }}
        >
          {championName}
        </h2>
        <div className="flex gap-4">
          <div className="gaming-card flex flex-col items-center gap-0.5 rounded-xl px-4 py-2">
            <span className="font-display text-xl font-black text-text">{games}</span>
            <span className="text-[10px] text-text-muted">Matches</span>
          </div>
          <div className="gaming-card flex flex-col items-center gap-0.5 rounded-xl px-4 py-2">
            <span className={`font-display text-xl font-black ${wrColor}`}>{winRate}%</span>
            <span className="text-[10px] text-text-muted">Win Rate</span>
          </div>
          <div className="gaming-card flex flex-col items-center gap-0.5 rounded-xl px-4 py-2">
            <span className={`font-display text-xl font-black ${kdaColor}`}>{kda}</span>
            <span className="text-[10px] text-text-muted">KDA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
