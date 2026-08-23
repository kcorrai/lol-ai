"use client";

import { useCounterPicks } from "@/hooks/useCounterPicks";
import { ChampionIcon } from "@/components/ui/ChampionIcon";

interface CounterPickCardProps {
  riotAccountId: string;
  championName: string;
}

function WinRatePip({ winRate }: { winRate: number }) {
  const color = winRate >= 60 ? "text-success" : winRate >= 50 ? "text-warning" : "text-danger";
  return <span className={`font-semibold ${color}`}>{winRate}%</span>;
}

export function CounterPickCard({ riotAccountId, championName }: CounterPickCardProps) {
  const { data, isLoading } = useCounterPicks(riotAccountId, championName);

  if (isLoading) return <div className="mt-2 h-16 animate-pulse rounded-lg bg-border/30" />;

  if (!data || (data.nemeses.length === 0 && data.prey.length === 0)) return null;

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-border bg-background p-3">
      {data.nemeses.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-danger/70">
            My Nightmares
          </p>
          <div className="space-y-0.5">
            {data.nemeses.map((e) => (
              <div key={e.championName} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <ChampionIcon name={e.championName} size={20} />
                  {e.championName}
                </span>
                <span className="text-text-muted">
                  <WinRatePip winRate={e.winRate} /> / {e.games} games
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.prey.length > 0 && (
        <div>
          <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-success/70">
            Easy Prey
          </p>
          <div className="space-y-0.5">
            {data.prey.map((e) => (
              <div key={e.championName} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-muted">
                  <ChampionIcon name={e.championName} size={20} />
                  {e.championName}
                </span>
                <span className="text-text-muted">
                  <WinRatePip winRate={e.winRate} /> / {e.games} games
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
