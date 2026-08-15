"use client";

import { ChampionIcon } from "@/components/ui/ChampionIcon";
import { HudPanel, HudRule } from "@/components/dashboard/laneiq/HudPanel";
import { computeSeriesLockouts, seriesStatus, teamOnSide } from "@/domains/draft";
import type { DraftSeriesState } from "@/domains/draft";

interface Props {
  state: DraftSeriesState;
  gameNumber: number;
}

/**
 * The series so far, including what it has already burned.
 *
 * The lockout pool is the part that matters: before game 3 of a fearless Bo5,
 * both teams need to see the twenty champions that are gone, not discover it one
 * greyed-out portrait at a time.
 */
export function SeriesOverview({ state, gameNumber }: Props): React.ReactElement | null {
  if (state.games.length < 2 || state.mode === "NORMAL") return null;

  const status = seriesStatus(state);
  const lockouts = computeSeriesLockouts(state, gameNumber);
  const burned = [...new Set([...lockouts.blue, ...lockouts.red])].sort();
  if (burned.length === 0) return null;

  return (
    <HudPanel className="p-4">
      <HudRule label="SERIES" />

      <p className="mt-3 text-[12px] text-text-body">
        {state.team1Name} <span className="font-mono text-accent">{status.team1Wins}</span>
        <span className="mx-1.5 text-text-faint">–</span>
        <span className="font-mono text-accent">{status.team2Wins}</span> {state.team2Name}
      </p>

      <p className="mt-3 text-[11.5px] text-text-muted">
        {state.mode === "FEARLESS"
          ? `${burned.length} champions are locked out for both teams.`
          : `${burned.length} champions are locked out for whichever team picked them.`}
      </p>

      <ul className="mt-2 flex flex-wrap gap-1">
        {burned.map((key) => (
          <li key={key} title={key} className="opacity-45">
            <ChampionIcon name={key} size={26} />
          </li>
        ))}
      </ul>

      {state.mode === "TEAM_FEARLESS" && (
        <p className="mt-2 text-[11px] text-text-faint">
          Team fearless — a champion your opponent burned is still yours to take.
        </p>
      )}

      <ul className="mt-3 flex flex-col gap-1 border-t border-border pt-3">
        {state.games
          .filter((g) => g.winnerSide)
          .map((game) => {
            const team = teamOnSide(game, game.winnerSide!);
            return (
              <li key={game.gameNumber} className="text-[11.5px] text-text-muted">
                Game {game.gameNumber} — {team === 1 ? state.team1Name : state.team2Name} won on{" "}
                {game.winnerSide === "BLUE" ? "blue" : "red"} side
              </li>
            );
          })}
      </ul>
    </HudPanel>
  );
}
