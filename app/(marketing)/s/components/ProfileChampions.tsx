import Image from "next/image";
import { championIconUrl } from "@/lib/ddragon";
import type { PreviewChampion } from "@/types/preview";

interface Props {
  champions: PreviewChampion[];
  /** Denominator for the share bar — how many games the sample covers. */
  totalGames: number;
}

export function ProfileChampions({ champions, totalGames }: Props): React.ReactElement | null {
  if (champions.length === 0) return null;

  return (
    <section className="notch border border-border bg-surface p-5">
      <p className="hud-label mb-3.5">{"// Champion pool"}</p>

      <div className="space-y-3">
        {champions.map((c) => {
          const share = totalGames > 0 ? Math.round((c.games / totalGames) * 100) : 0;
          return (
            <div key={c.championName} className="grid grid-cols-[34px_1fr_46px] items-center gap-3">
              <Image
                src={championIconUrl(c.championName)}
                alt=""
                aria-hidden
                width={34}
                height={34}
                unoptimized
                className="border border-border"
              />
              <div className="min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13px] text-text">{c.championName}</span>
                  <span className="shrink-0 font-mono text-[11px] text-text-muted">
                    {c.games} {c.games === 1 ? "game" : "games"}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden bg-surface-dark">
                  <div
                    className={c.winRate >= 50 ? "h-full bg-accent" : "h-full bg-danger"}
                    style={{ width: `${Math.max(share, 4)}%` }}
                  />
                </div>
              </div>
              <span
                className={`text-right font-mono text-[12px] font-bold ${
                  c.winRate >= 50 ? "text-accent" : "text-danger"
                }`}
              >
                {c.winRate}%
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
