import { findChampionStats } from "@/domains/meta/services/metaStatsService";
import { getChampionBuild } from "@/domains/meta/services/championDetailService";
import { type DdragonChampionSummary } from "@/lib/ddragon/championsData";
import { ALL_POSITIONS } from "@/domains/meta/positions";
import type { CanonicalPosition, GameLengthPoint, MetaSnapshot } from "@/domains/meta/types";
import type { DraftTeam, DraftSide, DraftChampion, TeamEval } from "./draftEval.types";

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
  const builds = await Promise.all(members.map((m) => getChampionBuild(m.championId, m.position)));
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

export async function evaluateTeam(
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
    champions
      .filter((c) => c.championId > 0)
      .map((c) => ({ championId: c.championId, position: c.position }))
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
