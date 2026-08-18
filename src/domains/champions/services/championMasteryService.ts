// Champion mastery, folded into the champion stats the app already keeps.
//
// `ChampionStat.masteryLevel` and `masteryPoints` have been in the schema since the
// beginning and nothing ever filled them — the app had no reason to spend a request
// on all-time data. The career timeline is that reason: match-v5 retains about two
// years, so mastery is the only number on the page that knows a player existed
// before then.

import { prisma } from "@/lib/db/prisma";
import { logger } from "@/lib/utils/logger";
import { getChampionMastery } from "@/domains/riot/services/riotApiClient";

/**
 * Fills mastery onto the champion rows this account already has.
 *
 * Deliberately an update and never an insert. A player has mastery on champions they
 * have never taken into ranked, and creating a `ChampionStat` row for each would put
 * a shelf of zero-game champions into `/champion-pool` — a page about what someone
 * plays, not what they own. The rows that exist are the ones worth annotating.
 *
 * Returns how many rows were touched, so a caller can log something meaningful.
 */
export async function refreshChampionMastery(riotAccountId: string): Promise<number> {
  const account = await prisma.riotAccount.findUnique({
    where: { id: riotAccountId },
    select: { puuid: true, region: true },
  });
  if (!account) return 0;

  const mastery = await getChampionMastery(account.puuid, account.region);
  if (mastery.length === 0) return 0;

  const byChampion = new Map(mastery.map((m) => [m.championId, m]));

  const rows = await prisma.championStat.findMany({
    where: { riotAccountId, championId: { in: [...byChampion.keys()] } },
    select: { id: true, championId: true },
  });

  // One update per row rather than a grouped `updateMany`: every champion carries a
  // different points total, so there is no set of rows sharing a value to group by.
  await Promise.all(
    rows.map((row) => {
      const m = byChampion.get(row.championId);
      if (!m) return Promise.resolve();
      return prisma.championStat.update({
        where: { id: row.id },
        // `masteryPoints` is BigInt in the schema — a million-point champion is still
        // far inside Number.MAX_SAFE_INTEGER, but the column decides the type, and
        // anything reading it back has to convert before it can be JSON.
        data: { masteryLevel: m.championLevel, masteryPoints: BigInt(m.championPoints) },
      });
    })
  );

  logger.info(`[mastery] Filled ${rows.length} champion rows for ${riotAccountId}`);
  return rows.length;
}
