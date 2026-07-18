import { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionCounters } from "@/domains/meta/services/championDetailService";
import { fetchAllChampions, type DdragonChampionSummary } from "@/lib/ddragon/championsData";
import { ALL_POSITIONS } from "@/domains/meta/positions";
import type { MetaSnapshot } from "@/domains/meta/types";
import { evaluateTeam } from "./draftTeamEval";
import type {
  DraftTeam,
  TeamEval,
  LaneEdge,
  DraftEvaluation,
} from "./draftEval.types";

export type {
  DraftTeam,
  DraftSide,
  DraftChampion,
  TeamEval,
  LaneEdge,
  DraftEvaluation,
} from "./draftEval.types";

async function computeLaneEdges(
  blue: DraftTeam,
  red: DraftTeam,
  snapshot: MetaSnapshot,
  ddragonByKey: Map<string, DdragonChampionSummary>
): Promise<LaneEdge[]> {
  const edges: LaneEdge[] = [];

  for (const position of ALL_POSITIONS) {
    const blueKey = blue[position];
    const redKey = red[position];
    if (!blueKey || !redKey) continue;

    const blueStats = findChampionStats(snapshot, blueKey);
    const redStats = findChampionStats(snapshot, redKey);
    if (!blueStats || !redStats) continue;

    const counters = await getChampionCounters(blueStats.championId, position);
    const entry = counters?.find((c) => c.opponentId === redStats.championId);
    const blueWinRate = entry?.subjectWinRate ?? 50;

    const blueName = ddragonByKey.get(blueKey.toLowerCase())?.name ?? blueKey;
    const redName = ddragonByKey.get(redKey.toLowerCase())?.name ?? redKey;
    const favored: LaneEdge["favored"] =
      blueWinRate >= 52 ? "blue" : blueWinRate <= 48 ? "red" : "even";
    const note =
      favored === "even"
        ? `${blueName} vs ${redName} is an even lane.`
        : favored === "blue"
          ? `${blueName} is favoured into ${redName} (${blueWinRate.toFixed(1)}%).`
          : `${redName} is favoured into ${blueName} (${(100 - blueWinRate).toFixed(1)}%).`;

    edges.push({ position, favored, blueKey: blueStats.championKey, redKey: redStats.championKey, blueWinRate, note });
  }

  return edges;
}

function buildVerdict(blue: TeamEval, red: TeamEval): string {
  const parts: string[] = [];
  const wrDiff = blue.avgWinRate - red.avgWinRate;
  if (Math.abs(wrDiff) < 0.5) {
    parts.push(`Both drafts are close on meta strength (${blue.avgWinRate}% vs ${red.avgWinRate}% average win rate).`);
  } else {
    const stronger = wrDiff > 0 ? "Blue" : "Red";
    parts.push(
      `${stronger} has the stronger meta picks (${blue.avgWinRate}% vs ${red.avgWinRate}% average win rate).`
    );
  }

  for (const [side, team] of [["Blue", blue], ["Red", red]] as const) {
    if (team.apShare >= 70) parts.push(`${side}'s damage is heavily magic (${team.apShare}% AP) — early magic resist punishes it.`);
    else if (team.adShare >= 70) parts.push(`${side}'s damage is heavily physical (${team.adShare}% AD) — stacking armour swings fights.`);
  }

  if (blue.frontlineScore - red.frontlineScore >= 25) parts.push("Blue has the stronger frontline to engage and peel.");
  else if (red.frontlineScore - blue.frontlineScore >= 25) parts.push("Red has the stronger frontline to engage and peel.");

  return parts.join(" ");
}

// A champion may only be drafted once across both teams. Drops later duplicates
// (blue is resolved first) so a hand-crafted ?blue=Garen,Garen URL can't smuggle
// the same pick into multiple slots.
export function dedupeDraft(blue: DraftTeam, red: DraftTeam): { blue: DraftTeam; red: DraftTeam } {
  const seen = new Set<string>();
  const clean = (team: DraftTeam): DraftTeam => {
    const out: DraftTeam = {};
    for (const position of ALL_POSITIONS) {
      const key = team[position];
      if (!key) continue;
      const lower = key.toLowerCase();
      if (seen.has(lower)) continue;
      seen.add(lower);
      out[position] = key;
    }
    return out;
  };
  return { blue: clean(blue), red: clean(red) };
}

// Deterministic, stats-based evaluation of two team comps. Returns null if the
// meta snapshot is unavailable.
export async function evaluateDraft(
  rawBlue: DraftTeam,
  rawRed: DraftTeam
): Promise<DraftEvaluation | null> {
  const { blue, red } = dedupeDraft(rawBlue, rawRed);
  const [snapshot, summaries] = await Promise.all([getMetaSnapshot(), fetchAllChampions()]);
  if (!snapshot) return null;

  const ddragonByKey = new Map(summaries.map((s) => [s.id.toLowerCase(), s]));

  const [blueEval, redEval, laneEdges] = await Promise.all([
    evaluateTeam("blue", blue, ddragonByKey, snapshot),
    evaluateTeam("red", red, ddragonByKey, snapshot),
    computeLaneEdges(blue, red, snapshot, ddragonByKey),
  ]);

  return {
    patch: snapshot.patch,
    blue: blueEval,
    red: redEval,
    laneEdges,
    verdict: buildVerdict(blueEval, redEval),
  };
}
