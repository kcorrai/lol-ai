"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { HudMeter, HudPanel } from "./HudPanel";
import type { MatchPerformance } from "@/domains/analysis/types/analysis.types";

const ROLE_LABEL: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

const ROLE_FILL = ["bg-accent", "bg-info", "bg-warning", "bg-line-3", "bg-line-2"];

interface PoolRow {
  champion: string;
  games: number;
  wins: number;
  kda: number;
}

function aggregate(matches: MatchPerformance[]): { pool: PoolRow[]; roles: [string, number][] } {
  const byChampion = new Map<string, { games: number; wins: number; k: number; d: number; a: number }>();
  const byRole = new Map<string, number>();

  for (const m of matches) {
    const c = byChampion.get(m.champion) ?? { games: 0, wins: 0, k: 0, d: 0, a: 0 };
    c.games += 1;
    if (m.won) c.wins += 1;
    c.k += m.kills;
    c.d += m.deaths;
    c.a += m.assists;
    byChampion.set(m.champion, c);
    byRole.set(m.position, (byRole.get(m.position) ?? 0) + 1);
  }

  const pool = [...byChampion.entries()]
    .map(([champion, c]) => ({
      champion,
      games: c.games,
      wins: c.wins,
      kda: (c.k + c.a) / Math.max(c.d, 1),
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 4);

  const roles = [...byRole.entries()].sort((a, b) => b[1] - a[1]);
  return { pool, roles };
}

export function ChampionPoolPanel({
  matches,
  isLoading,
}: {
  matches: MatchPerformance[] | undefined;
  isLoading: boolean;
}): React.ReactElement | null {
  if (isLoading) return <HudPanel className="h-[340px] animate-pulse">{null}</HudPanel>;
  if (!matches || matches.length === 0) return null;

  const { pool, roles } = aggregate(matches);
  const total = matches.length;

  return (
    <HudPanel className="p-5">
      <p className="hud-label mb-3.5">{"// Champion pool"}</p>

      <div className="grid gap-3">
        {pool.map((c) => {
          const wr = Math.round((c.wins / c.games) * 100);
          const tone = wr >= 55 ? "accent" : wr >= 48 ? "info" : "danger";
          const color = wr >= 55 ? "text-accent" : wr >= 48 ? "text-text" : "text-danger";
          return (
            <div
              key={c.champion}
              className="grid grid-cols-[34px_1fr_72px_46px] items-center gap-3"
            >
              <ChampionIcon name={c.champion} size={34} />
              <div className="min-w-0">
                <p className="truncate text-[13.5px] text-text">{c.champion}</p>
                <p className="font-mono text-[10.5px] tracking-[0.12em] text-text-muted">
                  {c.games} games · KDA {c.kda.toFixed(1)}
                </p>
              </div>
              <HudMeter value={wr} tone={tone} />
              <span className={`text-right font-mono text-[13px] ${color}`}>{wr}%</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border pt-3.5">
        <p className="hud-label mb-2.5">Role split</p>
        <div className="flex h-2.5 overflow-hidden">
          {roles.map(([role, count], i) => (
            <span
              key={role}
              title={`${ROLE_LABEL[role] ?? role} · ${count}`}
              className={ROLE_FILL[i % ROLE_FILL.length]}
              style={{ width: `${(count / total) * 100}%` }}
            />
          ))}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-3.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-text-muted">
          {roles.map(([role, count]) => (
            <span key={role}>
              {ROLE_LABEL[role] ?? role} {Math.round((count / total) * 100)}%
            </span>
          ))}
        </div>
      </div>
    </HudPanel>
  );
}
