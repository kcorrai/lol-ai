import { gameWinner } from "@/domains/esports/gameOutcome";
import type { GameStats, PlayerRole, ProChampionStat, ProMeta } from "@/domains/esports/types";

/**
 * Below this many games, a pick rate is an anecdote. The table still renders —
 * hiding it would be worse — but it says so.
 */
export const MIN_MEANINGFUL_GAMES = 15;

function topRole(roles: Partial<Record<PlayerRole, number>>): PlayerRole | null {
  let best: PlayerRole | null = null;
  let bestCount = 0;
  for (const [role, count] of Object.entries(roles) as [PlayerRole, number][]) {
    if (count > bestCount) {
      best = role;
      bestCount = count;
    }
  }
  return best;
}

/**
 * Pick counts, win rates and role splits per champion, over a set of finished
 * games.
 *
 * Bans are absent on purpose, not by omission: neither the event payload nor the
 * livestats feed publishes what was banned (see `DraftPanel`), so presence —
 * normally `(picks + bans) / games` — cannot be computed and is not claimed.
 * What is here is what the feeds prove.
 *
 * A game whose winner cannot be derived still counts its picks; it just does not
 * count towards anyone's wins, which is why win rate is computed over decided
 * games rather than over picks.
 */
export function aggregateProMeta(games: GameStats[]): ProMeta {
  const finished = games.filter((game) => game.finished);

  const picks = new Map<
    string,
    { picks: number; decided: number; wins: number; roles: Partial<Record<PlayerRole, number>> }
  >();
  const patches = new Set<string>();
  let lastGameAt: string | null = null;

  for (const game of finished) {
    if (game.patch) patches.add(game.patch);
    if (!lastGameAt || game.lastFrameAt > lastGameAt) lastGameAt = game.lastFrameAt;

    const winner = gameWinner(game);

    for (const team of [game.blue, game.red]) {
      const won = winner === null ? null : team.side === winner;

      for (const participant of team.participants) {
        const entry = picks.get(participant.championId) ?? {
          picks: 0,
          decided: 0,
          wins: 0,
          roles: {},
        };
        entry.picks += 1;
        if (won !== null) {
          entry.decided += 1;
          if (won) entry.wins += 1;
        }
        if (participant.role) {
          entry.roles[participant.role] = (entry.roles[participant.role] ?? 0) + 1;
        }
        picks.set(participant.championId, entry);
      }
    }
  }

  const champions: ProChampionStat[] = [...picks.entries()]
    .map(([championId, entry]) => ({
      championId,
      picks: entry.picks,
      wins: entry.wins,
      decidedGames: entry.decided,
      winRate: entry.decided > 0 ? (entry.wins / entry.decided) * 100 : null,
      pickRate: finished.length > 0 ? (entry.picks / finished.length) * 100 : 0,
      roles: entry.roles,
      topRole: topRole(entry.roles),
    }))
    .sort((a, b) => b.picks - a.picks || a.championId.localeCompare(b.championId));

  return {
    games: finished.length,
    patches: [...patches].sort(),
    lastGameAt,
    thinSample: finished.length < MIN_MEANINGFUL_GAMES,
    champions,
  };
}
