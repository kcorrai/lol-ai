import { getAiClient } from "@/lib/ai/client";
import { getCached, setCached, buildCacheKey } from "@/lib/ai/aiCache";
import { fetchAllChampions } from "@/lib/ddragon/championsData";

export interface MatchupGuideInput {
  playerChampion: string;
  opponentChampion: string;
  wins: number;
  losses: number;
  avgKda: number;
}

export interface MatchupGuideResult {
  guide: string;
  cacheHit: boolean;
}

// Free-text champion names reach an LLM prompt and an AI cache key, so both are
// resolved against the real Data Dragon roster first. This is the control that
// makes the endpoint safe: an unrecognised name is rejected before it can steer
// the prompt or mint a new cache entry.
async function resolveChampionName(name: string): Promise<string | null> {
  const champions = await fetchAllChampions();
  const match = champions.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
  return match?.name ?? null;
}

// Counts are rendered into the prompt, so they are clamped rather than trusted.
// A negative or absurd value is a malformed client, not something worth an error.
function clampCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(Math.trunc(value), 0), 10_000);
}

function clampKda(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
}

export class UnknownChampionError extends Error {
  constructor(name: string) {
    super(`Unknown champion: ${name}`);
    this.name = "UnknownChampionError";
  }
}

// The guide is user-agnostic, so it is cached for 7 days per champion pair and
// shared across users. Cache keys use the canonical Data Dragon spelling so
// "kai'sa" and "Kai'Sa" resolve to one entry rather than two.
export async function generateMatchupGuide(input: MatchupGuideInput): Promise<MatchupGuideResult> {
  const [player, opponent] = await Promise.all([
    resolveChampionName(input.playerChampion),
    resolveChampionName(input.opponentChampion),
  ]);

  if (!player) throw new UnknownChampionError(input.playerChampion);
  if (!opponent) throw new UnknownChampionError(input.opponentChampion);

  const cacheKey = buildCacheKey("matchup-guide", {
    playerChampion: player,
    opponentChampion: opponent,
  });

  const cached = await getCached(cacheKey);
  if (cached) {
    return { guide: (cached as { guide: string }).guide, cacheHit: true };
  }

  const wins = clampCount(input.wins);
  const losses = clampCount(input.losses);
  const avgKda = clampKda(input.avgKda);

  const guide = await getAiClient("matchup-guide").complete(
    "You are a LoL coaching assistant. You write short, action-oriented matchup guides.",
    `Write a ${player} vs ${opponent} matchup guide. The player has ${wins}W/${losses}L in this matchup (KDA: ${avgKda}). Exactly 4 points: lane phase strategy, 1 mistake to avoid, gank timing, late game priority. One sentence per point.`,
    { maxTokens: 250, temperature: 0.5 }
  );

  await setCached(cacheKey, "matchup-guide", { guide: guide.content }, 7);
  return { guide: guide.content, cacheHit: false };
}
