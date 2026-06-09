"use client";

import Image from "next/image";
import { championIconUrl } from "@/lib/ddragon";
import { cn } from "@/lib/utils";
import type { ChampionMonth } from "@/domains/analysis/services/milestoneService";

function ChampionRow({ champion, rank }: { champion: ChampionMonth; rank: number }) {
  const losses = champion.games - champion.wins;
  const wrColor = champion.winRate >= 55 ? "text-success" : champion.winRate < 45 ? "text-danger" : "text-text";
  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/4">
      <span className="w-5 text-center text-xs font-bold text-text-muted">{rank}</span>
      <Image src={championIconUrl(champion.name)} alt={champion.name} width={32} height={32} unoptimized className="rounded-md border border-border" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text">{champion.name}</p>
        <p className="text-xs text-text-muted">
          <span className="text-success">{champion.wins}G</span>{" "}
          <span className="text-danger">{losses}M</span>
          <span className="mx-1 text-border">·</span>
          {champion.games} maç
        </p>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-bold", wrColor)}>%{champion.winRate}</p>
        <p className="text-xs text-text-muted">{champion.avgKda.toFixed(2)} KDA</p>
      </div>
    </div>
  );
}

interface Props {
  champions: ChampionMonth[];
}

export function MilestoneChampionList({ champions }: Props) {
  return (
    <div className="gaming-card p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted">Bu Aydaki Şampiyonlar</p>
      <div className="space-y-1">
        {champions.map((champ, i) => (
          <ChampionRow key={champ.name} champion={champ} rank={i + 1} />
        ))}
      </div>
    </div>
  );
}
