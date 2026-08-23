import { evaluateDraft, getMatchupData, getMetaSnapshot } from "@/domains/meta";
import { assignLanes, findMatchup, type LaneFrequency } from "@/domains/riot/services/liveDraft";
import {
  getAccountByRiotId,
  getAccountByPuuid,
  getActiveGame,
  getRankedEntriesByPuuidDirect,
  type ActiveGameDTO,
  type ActiveGameParticipantDTO,
} from "@/domains/riot/services/riotApiClient";
import type { CanonicalPosition } from "@/domains/meta";
import type { LiveDraftTeams } from "@/domains/riot/services/liveDraft";
import type { LiveScout, LiveScoutPlayer, LiveScoutResult } from "./liveScout.types";

/**
 * A name is only wanted for display here, so a few minutes stale is fine. Long enough that all ten
 * players in one game looking each other up share the lookups, short enough that the RTBF sweep —
 * which reads uncached — is never the thing serving a forgotten account's old name.
 */
const NAME_CACHE_SECONDS = 600;

/**
 * Everything the public live page shows about a game in progress.
 *
 * Composed from parts that already existed rather than a second implementation: `getActiveGame`
 * for the lobby, `assignLanes` for the lanes Riot does not report, and `evaluateDraft` for the
 * read. That last one is the reason this page is worth building — it costs no Riot call at all,
 * so the expensive half is only the part that is about *people* (LA-70).
 */
export async function buildLiveScout(
  gameName: string,
  tagLine: string,
  region: string
): Promise<LiveScoutResult> {
  const account = await getAccountByRiotId(gameName, tagLine, region);
  const game = await getActiveGame(account.puuid, region);
  if (!game) return { inGame: false };

  const snapshot = await getMetaSnapshot();
  const championKeys = new Map<number, string>();
  const laneFrequency: LaneFrequency = new Map();
  for (const champion of snapshot?.champions ?? []) {
    championKeys.set(champion.championId, champion.championKey);
    if (champion.positions.length > 0) {
      laneFrequency.set(
        champion.championId,
        champion.positions.map((p) => ({ position: p.position, games: p.games }))
      );
    }
  }

  const draft = assignLanes(game.participants, laneFrequency, championKeys);
  const self = game.participants.find((p) => p.puuid === account.puuid);
  const yourSide: "blue" | "red" = self?.teamId === 200 ? "red" : "blue";

  const players = await enrichPlayers(game, account.puuid, region, draft, championKeys);

  // Both of these read the meta snapshot and never Riot, so a slow or throttled key cannot cost us
  // the analysis — only the names and ranks above degrade.
  const [evaluation, yourMatchup] = await Promise.all([
    evaluateDraft(draft.blue, draft.red),
    subjectMatchup(draft, yourSide, self && championKeys.get(self.championId)),
  ]);

  const scout: LiveScout = {
    inGame: true,
    gameId: game.gameId,
    gameMode: game.gameMode,
    gameLength: game.gameLength,
    yourSide,
    players,
    draft,
    evaluation,
    yourMatchup,
  };
  return scout;
}

/**
 * The subject's own lane, read in full.
 *
 * `findMatchup` names the opponent; `getMatchupData` is what turns that into a win rate and hints.
 * It leans harder on the lane inference than the board does — a mis-assigned lane there is one
 * champion in the wrong row, here it reads the wrong matchup entirely — so the view presents it
 * as the inference it is.
 */
async function subjectMatchup(
  draft: LiveDraftTeams,
  yourSide: "blue" | "red",
  yourChampion: string | undefined
) {
  const pairing = findMatchup(draft, yourSide, yourChampion);
  if (!pairing) return null;
  return getMatchupData(pairing.champion, pairing.opponent, pairing.position);
}

/** Where each champion ended up on the inferred board, so a player can be told their lane. */
function positionOf(draft: LiveDraftTeams, participant: ActiveGameParticipantDTO, key: string) {
  const side = participant.teamId === 200 ? draft.red : draft.blue;
  const found = (Object.keys(side) as CanonicalPosition[]).find((p) => side[p] === key);
  return found ?? null;
}

/**
 * Names and ranks for all ten, fetched in parallel and best-effort.
 *
 * Every lookup here soft-fails to null. A throttled key, a Riot outage or one unranked player must
 * cost that player's row a field — never the page, which is still worth reading for the draft
 * alone.
 */
async function enrichPlayers(
  game: ActiveGameDTO,
  subjectPuuid: string,
  region: string,
  draft: LiveDraftTeams,
  championKeys: Map<number, string>
): Promise<LiveScoutPlayer[]> {
  return Promise.all(
    game.participants.map(async (p) => {
      const championKey = championKeys.get(p.championId) ?? "";
      const [riotId, rank] = await Promise.all([
        resolveRiotId(p, region),
        resolveRank(p.puuid, region),
      ]);

      return {
        puuid: p.puuid,
        championKey,
        championId: p.championId,
        teamId: p.teamId,
        position: championKey ? positionOf(draft, p, championKey) : null,
        riotId,
        rank,
        isSubject: p.puuid === subjectPuuid,
      };
    })
  );
}

/** Riot's own field when it sends one, an account-v1 call when it does not. */
async function resolveRiotId(p: ActiveGameParticipantDTO, region: string): Promise<string | null> {
  if (p.riotId) return p.riotId;
  try {
    const account = await getAccountByPuuid(p.puuid, region, NAME_CACHE_SECONDS);
    return account.gameName ? `${account.gameName}#${account.tagLine}` : null;
  } catch {
    return null;
  }
}

async function resolveRank(puuid: string, region: string): Promise<LiveScoutPlayer["rank"]> {
  try {
    const entries = await getRankedEntriesByPuuidDirect(puuid, region);
    const solo = entries.find((e) => e.queueType === "RANKED_SOLO_5x5");
    if (!solo) return null;
    return {
      tier: solo.tier,
      division: solo.rank,
      lp: solo.leaguePoints,
      wins: solo.wins,
      losses: solo.losses,
    };
  } catch {
    return null;
  }
}
