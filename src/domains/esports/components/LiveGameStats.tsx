"use client";

import { useLiveGame } from "@/hooks/useLiveEsports";
import { DraftPanel } from "@/domains/esports/components/DraftPanel";
import { Scoreboard } from "@/domains/esports/components/Scoreboard";
import type { GameStats } from "@/domains/esports/types";

interface LiveGameStatsProps {
  gameId: string;
  /** Server-rendered snapshot: what the HTML ships with. */
  initial: GameStats;
  blueName: string;
  redName: string;
}

/**
 * A game being played right now: the same draft and scoreboard the finished
 * pages show, refreshed on the client while the game is live.
 *
 * The server snapshot is rendered first, so the page has real content before
 * hydration and never flashes empty. Polling stops the moment the feed reports
 * the game finished.
 */
export function LiveGameStats({
  gameId,
  initial,
  blueName,
  redName,
}: LiveGameStatsProps): React.ReactElement {
  const { data, isError } = useLiveGame(gameId, !initial.finished);
  const stats = data?.game ?? initial;

  return (
    <>
      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold uppercase text-text md:text-2xl">
            Draft
          </h2>
          <span className="hud-label">
            {stats.patch ? `Patch ${stats.patch}` : ""}
            {stats.finished ? "" : " · Live"}
            {isError ? " · reconnecting" : ""}
          </span>
        </div>
        <DraftPanel blue={stats.blue} red={stats.red} blueName={blueName} redName={redName} />
      </section>

      <section className="mt-12">
        <h2 className="mb-3 font-display text-xl font-extrabold uppercase text-text md:text-2xl">
          Scoreboard
        </h2>
        <Scoreboard blue={stats.blue} red={stats.red} blueName={blueName} redName={redName} />
      </section>
    </>
  );
}
