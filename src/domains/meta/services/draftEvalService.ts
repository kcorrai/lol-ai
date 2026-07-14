import {
  getMetaSnapshot,
  findChampionStats,
  getChampionCounters,
} from "@/domains/meta/services/metaStatsService";
import { fetchAllChampions, type DdragonChampionSummary } from "@/lib/ddragon/championsData";
import { ALL_POSITIONS } from "@/domains/meta/positions";
import type { CanonicalPosition, MetaSnapshot } from "@/domains/meta/types";

// A team is a mapping of lane → Data Dragon champion key. Partial so the UI can
// evaluate incomplete drafts.
export type DraftTeam = Partial<Record<CanonicalPosition, string>>;
export type DraftSide = "blue" | "red";

export interface DraftChampion {
  key: string;
  name: string;
  position: CanonicalPosition;
  winRate: number; // 0-100 in this lane
  tier: number; // 1 (best) .. 5
}

export interface TeamEval {
  side: DraftSide;
  champions: DraftChampion[];
  adShare: number; // 0-100 physical damage share
  apShare: number; // 0-100 magic damage share
  frontlineScore: number; // 0-100
  engageScore: number; // 0-100
  avgWinRate: number; // 0-100
  scalingLean: "early" | "balanced" | "late";
}

export interface LaneEdge {
  position: CanonicalPosition;
  favored: DraftSide | "even";
  blueKey: string;
  redKey: string;
  blueWinRate: number; // blue champion's win rate in the matchup (0-100)
  note: string;
}

export interface DraftEvaluation {
  patch: string;
  blue: TeamEval;
  red: TeamEval;
  laneEdges: LaneEdge[];
  verdict: string;
}

const clamp = (n: number): number => Math.max(0, Math.min(100, Math.round(n)));

function scalingLean(champs: DdragonChampionSummary[]): TeamEval["scalingLean"] {
  let score = 0;
  for (const c of champs) {
    if (c.tags.includes("Marksman")) score += 2;
    if (c.tags.includes("Mage")) score += 1;
    if (c.tags.includes("Assassin")) score -= 2;
    if (c.tags.includes("Fighter")) score -= 1;
  }
  if (score >= 3) return "late";
  if (score <= -3) return "early";
  return "balanced";
}

function evaluateTeam(
  side: DraftSide,
  team: DraftTeam,
  ddragonByKey: Map<string, DdragonChampionSummary>,
  snapshot: MetaSnapshot
): TeamEval {
  const champions: DraftChampion[] = [];
  const summaries: DdragonChampionSummary[] = [];
  let attack = 0;
  let magic = 0;
  let tankCount = 0;
  let fighterCount = 0;
  let supportCount = 0;
  let winRateSum = 0;

  for (const position of ALL_POSITIONS) {
    const key = team[position];
    if (!key) continue;
    const summary = ddragonByKey.get(key.toLowerCase());
    if (!summary) continue;
    summaries.push(summary);

    attack += summary.info.attack;
    magic += summary.info.magic;
    if (summary.tags.includes("Tank")) tankCount += 1;
    if (summary.tags.includes("Fighter")) fighterCount += 1;
    if (summary.tags.includes("Support")) supportCount += 1;

    const stats = findChampionStats(snapshot, key);
    const posStats = stats?.positions.find((p) => p.position === position);
    const winRate = posStats?.winRate ?? stats?.overallWinRate ?? 50;
    const tier = posStats?.tier ?? stats?.overallTier ?? 3;
    winRateSum += winRate;

    champions.push({ key: summary.id, name: summary.name, position, winRate, tier });
  }

  const dmgTotal = attack + magic || 1;
  const count = champions.length || 1;

  return {
    side,
    champions,
    adShare: clamp((attack / dmgTotal) * 100),
    apShare: clamp((magic / dmgTotal) * 100),
    frontlineScore: clamp(tankCount * 40 + fighterCount * 15),
    engageScore: clamp(tankCount * 35 + supportCount * 20 + fighterCount * 10),
    avgWinRate: Math.round((winRateSum / count) * 10) / 10,
    scalingLean: scalingLean(summaries),
  };
}

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

// Deterministic, stats-based evaluation of two team comps. Returns null if the
// meta snapshot is unavailable.
export async function evaluateDraft(
  blue: DraftTeam,
  red: DraftTeam
): Promise<DraftEvaluation | null> {
  const [snapshot, summaries] = await Promise.all([getMetaSnapshot(), fetchAllChampions()]);
  if (!snapshot) return null;

  const ddragonByKey = new Map(summaries.map((s) => [s.id.toLowerCase(), s]));

  const blueEval = evaluateTeam("blue", blue, ddragonByKey, snapshot);
  const redEval = evaluateTeam("red", red, ddragonByKey, snapshot);
  const laneEdges = await computeLaneEdges(blue, red, snapshot, ddragonByKey);

  return {
    patch: snapshot.patch,
    blue: blueEval,
    red: redEval,
    laneEdges,
    verdict: buildVerdict(blueEval, redEval),
  };
}
