import { prisma } from "@/lib/db/prisma";

export interface DeathTimingDistribution {
  early: number;  // 0-15 min
  mid: number;    // 15-25 min
  late: number;   // 25+ min
}

export interface TeamfightAnalysis {
  totalDeaths: number;
  deathTiming: DeathTimingDistribution;
  deathTimingPct: DeathTimingDistribution;
  avgDeathTimeMinutes: number;
  peakDangerWindow: string;
  matchCount: number;
}

const EARLY_CUTOFF_MS = 15 * 60 * 1000;
const MID_CUTOFF_MS = 25 * 60 * 1000;

export async function getTeamfightAnalysis(
  riotAccountId: string,
  matchCount: number = 10
): Promise<TeamfightAnalysis> {
  const recentMatches = await prisma.matchParticipant.findMany({
    where: { riotAccountId, match: { queueType: "RANKED_SOLO_5x5" } },
    select: { match: { select: { id: true } } },
    orderBy: { match: { gameStart: "desc" } },
    take: matchCount,
  });

  const matchDbIds = recentMatches.map((m) => m.match.id);

  const deathEvents = await prisma.matchDeathEvent.findMany({
    where: {
      riotAccountId,
      matchId: { in: matchDbIds },
      positionX: { not: -1 }, // exclude sentinel records
    },
    select: { gameTimeMs: true },
  });

  const totalDeaths = deathEvents.length;

  if (totalDeaths === 0) {
    return {
      totalDeaths: 0,
      deathTiming: { early: 0, mid: 0, late: 0 },
      deathTimingPct: { early: 0, mid: 0, late: 0 },
      avgDeathTimeMinutes: 0,
      peakDangerWindow: "insufficient data",
      matchCount: matchDbIds.length,
    };
  }

  let early = 0, mid = 0, late = 0;
  let totalMs = 0;

  for (const e of deathEvents) {
    totalMs += e.gameTimeMs;
    if (e.gameTimeMs < EARLY_CUTOFF_MS) early++;
    else if (e.gameTimeMs < MID_CUTOFF_MS) mid++;
    else late++;
  }

  const pct = (n: number) => Math.round((n / totalDeaths) * 100);
  const peakCount = Math.max(early, mid, late);
  const peakDangerWindow =
    peakCount === early ? "Early game (0-15 min)"
    : peakCount === mid ? "Mid game (15-25 min)"
    : "Late game (25+ min)";

  return {
    totalDeaths,
    deathTiming: { early, mid, late },
    deathTimingPct: { early: pct(early), mid: pct(mid), late: pct(late) },
    avgDeathTimeMinutes: Math.round((totalMs / totalDeaths / 60000) * 10) / 10,
    peakDangerWindow,
    matchCount: matchDbIds.length,
  };
}

export function teamfightContextForAi(analysis: TeamfightAnalysis): string {
  if (analysis.totalDeaths === 0) return "";
  return (
    `Death timing analysis (last ${analysis.matchCount} matches): ` +
    `Early ${analysis.deathTimingPct.early}%, ` +
    `Mid ${analysis.deathTimingPct.mid}%, ` +
    `Late ${analysis.deathTimingPct.late}%. ` +
    `Most dangerous window: ${analysis.peakDangerWindow}. ` +
    `Average death minute: ${analysis.avgDeathTimeMinutes}.`
  );
}
