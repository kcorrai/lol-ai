import { getActiveDuo, type ActiveDuo } from "@/domains/analysis/services/duoService";
import { loadDuoMatches } from "@/domains/analysis/services/duoMatchLoader";
import { computeDuoSynergy, type DuoSynergy } from "@/domains/analysis/services/duoSynergy";

export type { DuoSynergy };

export interface DuoSynergyResponse extends DuoSynergy {
  partner: ActiveDuo;
}

/**
 * Everything the duo panel shows, for the partner the player has marked.
 *
 * Returns null when no duo is selected, which is a state the panel renders as its picker rather
 * than an error.
 */
export async function getDuoSynergy(riotAccountId: string): Promise<DuoSynergyResponse | null> {
  const partner = await getActiveDuo(riotAccountId);
  if (!partner) return null;

  const { own, partner: partnerRows } = await loadDuoMatches(riotAccountId, partner.puuid);

  return { partner, ...computeDuoSynergy(own, partnerRows) };
}
