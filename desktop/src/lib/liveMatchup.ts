import { displayNameOf, type AllGameData, type LivePlayer } from "./liveClient/schema";
import type { LiveContextRequest } from "../../../src/domains/desktop/contract";

/**
 * Turning a live game payload into the question the website can answer.
 *
 * All of it is derivation from what is already on the player's own screen — which is the
 * line ADR-038 draws around what this product reads. Nothing here inspects an enemy the
 * scoreboard does not already show.
 *
 * Every function answers `null` rather than guessing. A wrong champion produces a
 * confident, wrong reading of a lane the player is not in, which is worse than a panel
 * that says nothing.
 */

/**
 * The player at this keyboard, found among the ten.
 *
 * `activePlayer` carries an identity but no champion, and `allPlayers` carries champions
 * but has to be searched — so the two are matched on whichever identity this client
 * version publishes. Matched field to field, never across: a client that emits `riotId`
 * emits it for both objects, and pairing a `riotId` against a `summonerName` would be a
 * guess about how Riot spells one in terms of the other.
 */
export function activePlayerOf(data: AllGameData): LivePlayer | null {
  const { riotId, summonerName } = data.activePlayer;

  if (riotId) {
    const byRiotId = data.allPlayers.find((p) => p.riotId === riotId);
    if (byRiotId) return byRiotId;
  }
  if (summonerName) {
    const byName = data.allPlayers.find((p) => p.summonerName === summonerName);
    if (byName) return byName;
  }
  return null;
}

/**
 * The champion in the same lane on the other team.
 *
 * An empty position is routine rather than a fault: the client leaves it empty for every
 * ARAM player and for anyone it has not resolved a lane for. A lane nobody can name has no
 * opponent to name either, and the caller renders that as a game with no matchup rather
 * than as an error.
 */
export function laneOpponentOf(data: AllGameData, me: LivePlayer): LivePlayer | null {
  const position = me.position?.trim();
  if (!position) return null;

  const opponents = data.allPlayers.filter(
    (p) => p.team !== me.team && p.position?.trim() === position
  );

  // Exactly one is the only answer worth acting on. Zero happens in a mode with no lanes;
  // two would mean the client resolved a lane it should not have, and picking one of them
  // would be choosing which enemy to read the player's history against.
  return opponents.length === 1 ? opponents[0] : null;
}

/** What the app can see of the game it is watching, or null when it cannot see enough. */
export function describeMatchup(data: AllGameData): LiveContextRequest | null {
  const me = activePlayerOf(data);
  if (!me) return null;

  const opponent = laneOpponentOf(data, me);

  return {
    championName: me.championName,
    opponentChampionName: opponent?.championName ?? null,
    position: me.position?.trim() || null,
    gameMode: data.gameData.gameMode,
  };
}

/**
 * What has to change before the website is worth asking again.
 *
 * The game is polled about once a second; the answer to this question changes when a game
 * starts and not once more. Keying the fetch on this is what keeps a forty-minute match at
 * one request rather than two thousand — and it is why the endpoint's rate limit is sized
 * for games instead of polls.
 */
export function matchupKey(request: LiveContextRequest | null): string | null {
  if (!request) return null;
  return [
    request.championName,
    request.opponentChampionName ?? "",
    request.position ?? "",
    request.gameMode,
  ].join("|");
}
