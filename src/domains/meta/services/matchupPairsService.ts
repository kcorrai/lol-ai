import { getMetaSnapshot } from "@/domains/meta/services/metaStatsService";

// Canonical matchup slug: two champion keys sorted alphabetically, joined by "-vs-".
// e.g. ("Zed", "Ahri") -> "ahri-vs-zed". Order-independent so each matchup has one URL.
export function matchupSlug(a: string, b: string): string {
  return [a.toLowerCase(), b.toLowerCase()].sort().join("-vs-");
}

export interface ParsedMatchup {
  first: string; // alphabetically-first key (lowercase)
  second: string;
  canonical: string;
}

export function parseMatchupSlug(slug: string): ParsedMatchup | null {
  const parts = slug.toLowerCase().split("-vs-");
  if (parts.length !== 2 || !parts[0] || !parts[1] || parts[0] === parts[1]) return null;
  const [first, second] = [parts[0], parts[1]].sort();
  return { first, second, canonical: `${first}-vs-${second}` };
}

// Enumerates the most significant champion-vs-champion pairs from the cached bulk
// snapshot (each champion's top per-lane counters — all high-sample). Deduped to
// alphabetical slugs. Cheap: one cached snapshot read, no per-champion fetches.
export async function getMatchupPairs(limit = 400): Promise<{ a: string; b: string }[]> {
  const snapshot = await getMetaSnapshot();
  if (!snapshot) return [];

  const byId = new Map(snapshot.champions.map((c) => [c.championId, c.championKey]));
  const seen = new Set<string>();
  const pairs: { a: string; b: string }[] = [];

  for (const champ of snapshot.champions) {
    for (const pos of champ.positions) {
      for (const counter of pos.counters) {
        const opp = byId.get(counter.opponentId);
        if (!opp) continue;
        const [a, b] = [champ.championKey, opp].sort();
        const slug = `${a.toLowerCase()}-vs-${b.toLowerCase()}`;
        if (seen.has(slug)) continue;
        seen.add(slug);
        pairs.push({ a, b });
        if (pairs.length >= limit) return pairs;
      }
    }
  }
  return pairs;
}
