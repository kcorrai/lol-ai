import { getMetaSnapshot, findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionCounters, getChampionBuild } from "@/domains/meta/services/championDetailService";
import { fetchAllChampions, type DdragonChampionSummary } from "@/lib/ddragon/championsData";
import { ALL_POSITIONS } from "@/domains/meta/positions";
import type { CanonicalPosition, GameLengthPoint, MetaSnapshot } from "@/domains/meta/types";

// A team is a mapping of lane → Data Dragon champion key. Partial so the UI can
// evaluate incomplete drafts.
export type DraftTeam = Partial<Record<CanonicalPosition, string>>;
export type DraftSide = "blue" | "red";

export interface DraftChampion {
  key: string;
  name: string;
  championId: number;
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
  gameLengthCurve: GameLengthPoint[]; // aggregated team win rate by game length
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

// Fallback scaling read from champion tags, used only when no real game-length
// data is available for the team.
function tagScaling(champs: DdragonChampionSummary[]): TeamEval["scalingLean"] {
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

// Averages each champion's real win-rate-by-game-length curve into one team curve.
async function aggregateTeamCurve(
  members: { championId: number; position: CanonicalPosition }[]
): Promise<GameLengthPoint[]> {
  const builds = await Promise.all(
    members.map((m) => getChampionBuild(m.championId, m.position))
  );
  const buckets = new Map<number, { sum: number; n: number }>();
  for (const build of builds) {
    if (!build) continue;
    for (const g of build.gameLengths) {
      const e = buckets.get(g.minutes) ?? { sum: 0, n: 0 };
      e.sum += g.winRate;
      e.n += 1;
      buckets.set(g.minutes, e);
    }
  }
  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([minutes, e]) => ({ minutes, winRate: Math.round((e.sum / e.n) * 10) / 10 }));
}

// Scaling derived from the real aggregated curve (< 25 min vs 40+ min), or null
// when the curve lacks both endpoints.
function curveScaling(curve: GameLengthPoint[]): TeamEval["scalingLean"] | null {
  const early = curve.find((g) => g.minutes === 0)?.winRate;
  const late = curve.find((g) => g.minutes === 40)?.winRate;
  if (early === undefined || late === undefined) return null;
  if (late >= early + 1) return "late";
  if (early >= late + 1) return "early";
  return "balanced";
}

async function evaluateTeam(
  side: DraftSide,
  team: DraftTeam,
  ddragonByKey: Map<string, DdragonChampionSummary>,
  snapshot: MetaSnapshot
): Promise<TeamEval> {
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

    champions.push({
      key: summary.id,
      name: summary.name,
      championId: stats?.championId ?? 0,
      position,
      winRate,
      tier,
    });
  }

  const dmgTotal = attack + magic || 1;
  const count = champions.length || 1;

  const curve = await aggregateTeamCurve(
    champions.filter((c) => c.championId > 0).map((c) => ({ championId: c.championId, position: c.position }))
  );

  return {
    side,
    champions,
    adShare: clamp((attack / dmgTotal) * 100),
    apShare: clamp((magic / dmgTotal) * 100),
    frontlineScore: clamp(tankCount * 40 + fighterCount * 15),
    engageScore: clamp(tankCount * 35 + supportCount * 20 + fighterCount * 10),
    avgWinRate: Math.round((winRateSum / count) * 10) / 10,
    // Prefer the real curve; fall back to tag heuristics when data is missing.
    scalingLean: curveScaling(curve) ?? tagScaling(summaries),
    gameLengthCurve: curve,
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
