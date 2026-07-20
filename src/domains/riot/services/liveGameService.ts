import { prisma } from "@/lib/db/prisma";
import { getMetaSnapshot } from "@/domains/meta";
import { getActiveGame } from "@/domains/riot/services/riotApiClient";
import { assignLanes, type LaneFrequency, type LiveDraftTeams } from "@/domains/riot/services/liveDraft";

export interface LiveDraft {
  inGame: true;
  gameMode: string;
  gameLength: number; // seconds since the game started
  draft: LiveDraftTeams;
  /** The side the player themselves is on, so the UI can say which team is theirs. */
  yourSide: "blue" | "red";
}

export type LiveGameResult = LiveDraft | { inGame: false };

/**
 * The player's current game, shaped for the draft analyzer.
 *
 * Lanes are inferred (see `assignLanes`) because the Spectator API doesn't report them — callers
 * should present the result as a starting point, not a finished draft.
 */
export async function getLiveDraft(riotAccountId: string): Promise<LiveGameResult> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { puuid: true, region: true },
  });
  if (!account) return { inGame: false };

  const game = await getActiveGame(account.puuid, account.region);
  if (!game) return { inGame: false };

  const snapshot = await getMetaSnapshot();
  const laneFrequency: LaneFrequency = new Map();
  const championKeys = new Map<number, string>();

  for (const champion of snapshot?.champions ?? []) {
    championKeys.set(champion.championId, champion.championKey);
    if (champion.positions.length > 0) {
      laneFrequency.set(
        champion.championId,
        champion.positions.map((p) => ({ position: p.position, games: p.games })),
      );
    }
  }

  const self = game.participants.find((p) => p.puuid === account.puuid);

  return {
    inGame: true,
    gameMode: game.gameMode,
    gameLength: game.gameLength,
    draft: assignLanes(game.participants, laneFrequency, championKeys),
    yourSide: self?.teamId === 200 ? "red" : "blue",
  };
}
