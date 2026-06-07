"use client";

import Image from "next/image";

const SPLASH_URL = (name: string) =>
  `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${name}_0.jpg`;

interface Props {
  championName: string;
  games: number;
  winRate: number;
  kda: number;
}

export function RecapChampion({ championName, games, winRate, kda }: Props) {
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-end pb-12">
      {/* Full background splash */}
      <Image
        src={SPLASH_URL(championName)}
        alt={championName}
        fill
        unoptimized
        className="object-cover object-top"
        style={{ opacity: 0.4 }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

      {/* Stats overlay */}
      <div className="relative z-10 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Bu Sezonun Yıldızı</p>
        <h2 className="font-display text-5xl font-black text-text">{championName}</h2>
        <div className="flex justify-center gap-6 text-sm text-text-muted">
          <span><span className="font-bold text-text">{games}</span> Maç</span>
          <span><span className="font-bold text-text">%{winRate}</span> WR</span>
          <span><span className="font-bold text-text">{kda}</span> KDA</span>
        </div>
      </div>
    </div>
  );
}
