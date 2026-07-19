import { getChampionPool, type ChampionPoolEntry } from "@/domains/champions";
import {
  getTierList,
  tierLetter,
  ALL_POSITIONS,
  POSITION_LABELS,
  POSITION_SLUG,
  type CanonicalPosition,
  type RoleTierList,
} from "@/domains/meta";

export type MetaRecKind = "keep" | "improve" | "switch";

export interface MetaRecommendation {
  kind: MetaRecKind;
  championKey: string;
  championName: string;
  position: CanonicalPosition;
  positionLabel: string;
  tier: string; // letter S..D
  winRate: number; // user's win rate on this champ (0-100)
  games: number; // user's games on this champ
  message: string;
  alternative?: { championKey: string; championName: string; tier: string };
  toolHref: string;
  toolLabel: string;
}

// op.gg display names and the user's champion names both come from Data Dragon, but casing and
// punctuation vary ("Cho'Gath" vs "Chogath"). Normalize before matching.
function norm(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

type TierListMap = Partial<Record<CanonicalPosition, RoleTierList | null>>;

// Where a champion stands in the current meta: its best (lowest tier number) placement across
// every lane it shows up in — i.e. treat its strongest lane as its identity.
function bestPlacement(
  championName: string,
  tierLists: TierListMap
): { position: CanonicalPosition; list: RoleTierList; entry: RoleTierList["entries"][number] } | null {
  const key = norm(championName);
  let best: { position: CanonicalPosition; list: RoleTierList; entry: RoleTierList["entries"][number] } | null = null;
  for (const position of ALL_POSITIONS) {
    const list = tierLists[position];
    if (!list) continue;
    const entry = list.entries.find((e) => norm(e.name) === key);
    if (!entry) continue;
    if (!best || entry.tier < best.entry.tier || (entry.tier === best.entry.tier && entry.rank < best.entry.rank)) {
      best = { position, list, entry };
    }
  }
  return best;
}

// First strong (S/A-tier, confident) champion in a lane the user doesn't already play — the
// "consider switching to this" suggestion.
function suggestAlternative(
  list: RoleTierList,
  poolNames: Set<string>
): { championKey: string; championName: string; tier: string } | null {
  const alt = list.entries.find(
    (e) => e.tier <= 2 && !e.lowConfidence && !poolNames.has(norm(e.name))
  );
  return alt ? { championKey: alt.championKey, championName: alt.name, tier: tierLetter(alt.tier) } : null;
}

// Pure: turn a champion pool + the current tier lists into a short, prioritized set of
// patch-aware recommendations. Exported for unit tests.
export function buildRecommendations(
  pool: ChampionPoolEntry[],
  tierLists: TierListMap,
  limit = 4
): MetaRecommendation[] {
  const poolNames = new Set(pool.map((p) => norm(p.championName)));
  // Most-played first — those are the champions the user actually cares about keeping current.
  const mains = [...pool].sort((a, b) => b.gamesPlayed - a.gamesPlayed).slice(0, 6);

  const recs: MetaRecommendation[] = [];
  for (const champ of mains) {
    const placement = bestPlacement(champ.championName, tierLists);
    if (!placement) continue; // off-meta / no data — nothing useful to say
    const { position, list, entry } = placement;
    const positionLabel = POSITION_LABELS[position];
    const tier = tierLetter(entry.tier);
    const slug = POSITION_SLUG[position];

    // Meta signal…
    const metaStrong = entry.tier <= 2;
    const weak = entry.tier >= 4;
    // Slipped meaningfully vs last patch (higher rank number = worse).
    const dropped = entry.prevPatchRank > 0 && entry.rank - entry.prevPatchRank >= 5;
    // …crossed with the user's own results. A meta-strong champ the user keeps losing on isn't a
    // "keep spamming" — the problem is the player/matchups, not the pick.
    const userLosing = champ.gamesPlayed >= 5 && champ.winRate < 45;
    const base = { championKey: entry.championKey, championName: champ.championName, position, positionLabel, tier, winRate: champ.winRate, games: champ.gamesPlayed };

    if (weak || dropped) {
      const alternative = suggestAlternative(list, poolNames) ?? undefined;
      const altText = alternative ? ` Consider ${alternative.championName} (${alternative.tier}-tier) instead.` : "";
      recs.push({
        ...base,
        kind: "switch",
        message: `${champ.championName} ${weak ? `is only ${tier}-tier` : "slipped"} ${positionLabel} this patch.${altText}`,
        alternative,
        toolHref: `/tools/counter-picker?champion=${entry.championKey}`,
        toolLabel: `See ${champ.championName} counters`,
      });
    } else if (userLosing) {
      recs.push({
        ...base,
        kind: "improve",
        message: `${champ.championName} is ${tier}-tier ${positionLabel}, but you're at ${champ.winRate}% over ${champ.gamesPlayed} games — the pick is fine, the matchups aren't.`,
        toolHref: `/tools/counter-picker?champion=${entry.championKey}`,
        toolLabel: `See what beats ${champ.championName}`,
      });
    } else if (metaStrong) {
      const winText = champ.winRate >= 52 ? ` and you're winning ${champ.winRate}%` : "";
      recs.push({
        ...base,
        kind: "keep",
        message: `${champ.championName} is ${tier}-tier ${positionLabel} this patch${winText} — keep spamming it.`,
        toolHref: `/tools/tier-list/${slug}`,
        toolLabel: `View the ${positionLabel} tier list`,
      });
    }

    if (recs.length >= limit) break;
  }

  return recs;
}

export async function getMetaRecommendations(riotAccountId: string): Promise<MetaRecommendation[]> {
  const [pool, ...lists] = await Promise.all([
    getChampionPool(riotAccountId, 3),
    ...ALL_POSITIONS.map((p) => getTierList(p)),
  ]);

  const tierLists: TierListMap = {};
  ALL_POSITIONS.forEach((p, i) => {
    tierLists[p] = lists[i];
  });

  return buildRecommendations(pool, tierLists);
}
