import Image from "next/image";
import { Swords, Crosshair } from "lucide-react";

const CHAMPION_VERSION = "14.24.1";

function formatMasteryPoints(pts: number): string {
  if (pts >= 1_000_000) return `${(pts / 1_000_000).toFixed(1)}M`;
  if (pts >= 1_000) return `${(pts / 1_000).toFixed(0)}K`;
  return String(pts);
}

function kdaColor(kda: number): string {
  if (kda >= 4) return "#C6FF3D";
  if (kda >= 3) return "#C6FF3D";
  return "#f87171";
}

function wrColor(wr: number): string {
  if (wr >= 55) return "#C6FF3D";
  if (wr >= 50) return "#C6FF3D";
  return "#f87171";
}

interface Champion {
  name: string;
  games: number;
  winRate: number;
  avgKda: number;
  avgCsPerMinute: number;
  masteryLevel: number | null;
  masteryPoints: number | null;
}

interface Props {
  champions: Champion[];
}

export function PublicProfileChampionPool({ champions }: Props) {
  if (champions.length === 0) return null;
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        <Swords className="h-3.5 w-3.5 text-text-muted/50" />
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-text-muted/50">Champion Pool</h2>
      </div>
      <div className="space-y-3">
        {champions.map((c, i) => {
          const wc = wrColor(c.winRate);
          const kc = kdaColor(c.avgKda);
          return (
            <div key={c.name} className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-2/40 p-3">
              <span className="w-4 shrink-0 text-center text-xs font-bold text-text-muted/40">{i + 1}</span>
              <div className="relative shrink-0">
                <Image
                  src={`https://ddragon.leagueoflegends.com/cdn/${CHAMPION_VERSION}/img/champion/${c.name}.png`}
                  alt={c.name} width={44} height={44} unoptimized
                  className="rounded-lg border border-white/10"
                />
                {c.masteryLevel !== null && c.masteryLevel >= 7 && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full border border-warning/40 bg-warning/20 text-[8px] font-bold text-warning">
                    M{c.masteryLevel}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-text">{c.name}</span>
                  <span className="shrink-0 text-xs text-text-muted">{c.games} games</span>
                </div>
                <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${c.winRate}%`, background: wc }} />
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-text-muted">
                  <span style={{ color: wc }} className="font-semibold">{c.winRate}% WR</span>
                  <span className="flex items-center gap-0.5">
                    <Crosshair className="h-2.5 w-2.5" />
                    <span style={{ color: kc }} className="font-medium">{c.avgKda} KDA</span>
                  </span>
                  <span className="font-medium">{c.avgCsPerMinute} CS/min</span>
                  {c.masteryPoints !== null && (
                    <span className="ml-auto text-warning/60">{formatMasteryPoints(c.masteryPoints)} p</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
