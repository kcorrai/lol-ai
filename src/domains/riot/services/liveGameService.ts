import { prisma } from "@/lib/db/prisma";
import { getMetaSnapshot } from "@/domains/meta";
import { getActiveGame } from "@/domains/riot/services/riotApiClient";
import {
  assignLanes,
  findMatchup,
  type LaneFrequency,
  type LiveDraftTeams,
  type LiveMatchup,
} from "@/domains/riot/services/liveDraft";

export interface LiveDraft {
  inGame: true;
  gameMode: string;
  gameLength: number; // seconds since the game started
  draft: LiveDraftTeams;
  /** The side the player themselves is on, so the UI can say which team is theirs. */
  yourSide: "blue" | "red";
  /**
   * The player's own champion and the enemy sharing their inferred lane — enough to open the
   * matchup analyzer. Null when the lane couldn't be worked out or nobody opposes it.
   *
   * This leans harder on the lane inference than `draft` does: a mis-assigned lane there is one
   * champion in the wrong row, but here it picks the wrong opponent and the whole answer changes.
   * Callers should let the player correct it.
   */
  yourMatchup: LiveMatchup | null;
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
  const draft = assignLanes(game.participants, laneFrequency, championKeys);
  const yourSide = self?.teamId === 200 ? "red" : "blue";

  return {
    inGame: true,
    gameMode: game.gameMode,
    gameLength: game.gameLength,
    draft,
    yourSide,
    yourMatchup: findMatchup(draft, yourSide, self && championKeys.get(self.championId)),
  };
}

