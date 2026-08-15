import { getLeagues } from "@/domains/esports/services/leagueService";
import { getTeams, getTeamMatches } from "@/domains/esports/services/teamService";
import { getMatch } from "@/domains/esports/services/matchService";
import { getGameStats } from "@/domains/esports/services/gameStatsService";
import type {
  EsportsLeague,
  EsportsPlayer,
  EsportsTeam,
  PlayerChampionStat,
  PlayerEntry,
  PlayerGame,
} from "@/domains/esports/types";

/**
 * How far back a player's recent games are read.
 *
 * Each series costs one match lookup plus two livestats calls per game, so this
 * is the page's real cost knob. Game stats are cached per *game* for a month, so
 * the second player from the same team is nearly free — but the first one pays,
 * and four series is enough to show a champion pool without walking a season.
 */
const SERIES_TO_WALK = 4;

export function playerSlug(handle: string): string {
  return handle
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function leagueRank(leagues: EsportsLeague[]): Map<string, number> {
  const rank = new Map<string, number>();
  leagues.forEach((league, index) => rank.set(league.name.toLowerCase(), index));
  return rank;
}

/**
 * Every rostered player, each with the URL it answers to.
 *
 * 604 of ~2800 handles are shared by more than one roster — mostly because an
 * academy team lists the same player as its main squad ("chovy" is on both Gen.G
 * and Gen.G Challengers). So the plain slug goes to the candidate in the more
 * prominent league, and the rest fall back to `handle-teamcode`. Giving every
 * colliding player a suffixed slug would cost "/esports/players/chovy" — one of
 * the most valuable URLs in the section — to avoid an ambiguity that has an
 * obvious answer.
 */
export function buildPlayerIndex(teams: EsportsTeam[], leagues: EsportsLeague[]): PlayerEntry[] {
  const rank = leagueRank(leagues);
  const candidates = new Map<string, { player: EsportsPlayer; team: EsportsTeam }[]>();

  for (const team of teams) {
    for (const player of team.players) {
      const base = playerSlug(player.handle);
      if (!base) continue;
      const existing = candidates.get(base);
      if (existing) existing.push({ player, team });
      else candidates.set(base, [{ player, team }]);
    }
  }

  const entries: PlayerEntry[] = [];

  for (const [base, group] of candidates) {
    const ordered = [...group].sort((a, b) => {
      const rankA = rank.get(a.team.league?.name.toLowerCase() ?? "") ?? Number.MAX_SAFE_INTEGER;
      const rankB = rank.get(b.team.league?.name.toLowerCase() ?? "") ?? Number.MAX_SAFE_INTEGER;
      if (rankA !== rankB) return rankA - rankB;
      return a.team.code.localeCompare(b.team.code);
    });

    ordered.forEach((candidate, index) => {
      entries.push({
        slug: index === 0 ? base : `${base}-${candidate.team.code.toLowerCase()}`,
        player: candidate.player,
        team: candidate.team,
      });
    });
  }

  return entries.sort((a, b) => a.slug.localeCompare(b.slug));
}

/** The whole index, built from the cached team list. */
export async function getPlayerIndex(): Promise<PlayerEntry[]> {
  const [teams, leagues] = await Promise.all([getTeams(), getLeagues()]);
  const rostered = teams.filter(
    (team) => team.status === "active" && team.players.length > 0 && team.league !== null
  );
  return buildPlayerIndex(rostered, leagues);
}

export async function getPlayer(slug: string): Promise<PlayerEntry | null> {
  const needle = slug.toLowerCase();
  const index = await getPlayerIndex();
  return index.find((entry) => entry.slug === needle) ?? null;
}

/** A team's players as index entries, so rosters can link to the right URLs. */
export async function getTeamPlayerEntries(teamId: string): Promise<PlayerEntry[]> {
  const index = await getPlayerIndex();
  return index.filter((entry) => entry.team.id === teamId);
}

function matchesPlayer(handle: string, playerId: string | null, candidate: PlayerGame): boolean {
  return playerId !== null
    ? candidate.playerId === playerId
    : candidate.handle.toLowerCase() === handle.toLowerCase();
}

/**
 * The player's games from their team's recent series.
 *
 * Identified by esports player id where the game data carries one, and by handle
 * otherwise — the same person can appear under a different team prefix.
 */
export async function getPlayerGames(entry: PlayerEntry): Promise<PlayerGame[]> {
  const { results } = await getTeamMatches(entry.team);
  const series = results.slice(0, SERIES_TO_WALK);

  const games: PlayerGame[] = [];

  for (const event of series) {
    const match = await getMatch(event.matchId);
    if (!match) continue;

    for (const game of match.games) {
      if (game.state !== "completed") continue;

      const stats = await getGameStats(game.id, { completed: true });
      if (!stats) continue;

      for (const side of [stats.blue, stats.red] as const) {
        for (const participant of side.participants) {
          const candidate: PlayerGame = {
            matchId: match.matchId,
            gameId: game.id,
            gameNumber: game.number,
            playerId: participant.playerId,
            handle: participant.handle,
            championId: participant.championId,
            kills: participant.kills,
            deaths: participant.deaths,
            assists: participant.assists,
            creepScore: participant.creepScore,
          };
          if (matchesPlayer(entry.player.handle, entry.player.id, candidate)) {
            games.push(candidate);
          }
        }
      }
    }
  }

  return games;
}

/** Champion pool over the games read, most played first. */
export function championPool(games: PlayerGame[]): PlayerChampionStat[] {
  const byChampion = new Map<string, PlayerChampionStat>();

  for (const game of games) {
    const existing = byChampion.get(game.championId);
    if (existing) {
      existing.games += 1;
      existing.kills += game.kills;
      existing.deaths += game.deaths;
      existing.assists += game.assists;
    } else {
      byChampion.set(game.championId, {
        championId: game.championId,
        games: 1,
        kills: game.kills,
        deaths: game.deaths,
        assists: game.assists,
      });
    }
  }

  return [...byChampion.values()].sort(
    (a, b) => b.games - a.games || a.championId.localeCompare(b.championId)
  );
}
