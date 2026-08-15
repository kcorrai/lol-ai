"use client";

import { usePathname, useRouter } from "next/navigation";
import { seriesStatus, teamOnSide } from "@/domains/draft";
import type { DraftSeriesState } from "@/domains/draft";

interface Props {
  state: DraftSeriesState;
  gameNumber: number;
}

export function SeriesTabs({ state, gameNumber }: Props): React.ReactElement | null {
  const router = useRouter();
  const pathname = usePathname();
  const status = seriesStatus(state);

  if (state.games.length < 2) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="hud-label">Series</span>
      <div className="flex gap-1">
        {state.games.map((game) => {
          const winnerTeam = game.winnerSide ? teamOnSide(game, game.winnerSide) : null;
          const winnerName =
            winnerTeam === 1 ? state.team1Name : winnerTeam === 2 ? state.team2Name : null;
          return (
            <button
              key={game.gameNumber}
              type="button"
              onClick={() => router.push(`${pathname}?game=${game.gameNumber}`, { scroll: false })}
              aria-current={game.gameNumber === gameNumber ? "true" : undefined}
              title={winnerName ? `Won by ${winnerName}` : undefined}
              className={`notch-sm border px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                game.gameNumber === gameNumber
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-border bg-surface-2 text-text-muted hover:text-text-body"
              }`}
            >
              G{game.gameNumber}
              {winnerName && <span className="ml-1.5 text-accent">✓</span>}
            </button>
          );
        })}
      </div>
      <span className="font-mono text-[12px] text-text-muted">
        {status.team1Wins} – {status.team2Wins}
      </span>
    </div>
  );
}
