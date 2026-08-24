import { getActiveChallenges, getActiveHabits } from "@/domains/analysis";
import type { ChallengeWithProgress } from "@/domains/analysis";
import { getChampionBaseline } from "@/domains/champions";
import type { ChampionBaseline } from "@/domains/champions";
import { getPersonalMatchup } from "@/domains/counter";
import { getChampionBuild, getMatchupData, parsePosition } from "@/domains/meta";
import type {
  LiveBaseline,
  LiveBuild,
  LiveChallenge,
  LiveContext,
  LiveContextRequest,
  LiveHabit,
  LiveMetaMatchup,
  LivePersonalMatchup,
} from "@/domains/desktop/contract";
import { fetchAllChampions, type DdragonChampionSummary } from "@/lib/ddragon/championsData";
import { fetchItems, type ItemInfo } from "@/lib/ddragon/itemsData";
import { toLiveBuild } from "@/domains/desktop/services/liveBuild";

// What the website knows about the game the desktop app is watching (ADR-038, phase 4).
//
// Six reads, each from another domain's public API and none of them new: this
// account's own record in the lane (`counter`), the patch-current snapshot for the
// same pair and how the champion is built on it (`meta`), the weaknesses already
// detected from this account's matches and the goals it was already set
// (`analysis`), and what this account normally does on the champion it is playing
// (`champions`). Nothing is computed here that
// the website does not already compute for its own pages — the value this adds is
// that it can be asked for during the game, which only a process on the player's
// machine can do.
//
// Nothing on this path may call a language model. The app asks at the start of a
// match, and a round trip to a model would cost the player time in the one minute
// they cannot spare — which is why the baseline has its own lean service rather
// than reusing the champion deep dive, whose summary is generated.

/** At most this many habits reach the panel; the app has one screen, not a report. */
const MAX_HABITS = 3;

/**
 * Champion names arrive as free text from a client this code does not control, and
 * they go on to key a cache and steer two other domains' queries. Resolving them
 * against the real Data Dragon roster first is the control that makes that safe:
 * an unrecognised name is refused here and never reaches a service.
 */
function resolve(
  roster: DdragonChampionSummary[],
  name: string | null
): DdragonChampionSummary | null {
  if (!name) return null;
  const wanted = name.trim().toLowerCase();
  return (
    roster.find((c) => c.name.toLowerCase() === wanted) ??
    // The Live Client Data API answers with the display name, but its own published
    // sample is not consistent about it across patches, and the internal id is what
    // older payloads carried. Accepting both costs one comparison.
    roster.find((c) => c.id.toLowerCase() === wanted) ??
    null
  );
}

/** Data Dragon's `key` is the numeric champion id every other table in this product uses. */
function championId(champion: DdragonChampionSummary): number | null {
  const id = Number(champion.key);
  return Number.isInteger(id) ? id : null;
}

function toPersonal(entry: {
  games: number;
  wins: number;
  winRate: number;
  avgKda: number;
  trend: LivePersonalMatchup["trend"];
}): LivePersonalMatchup {
  return {
    games: entry.games,
    wins: entry.wins,
    winRate: entry.winRate,
    avgKda: Math.round(entry.avgKda * 100) / 100,
    trend: entry.trend,
  };
}

function toHabit(habit: {
  habitType: string;
  displayName: string;
  severity: LiveHabit["severity"];
  message: string;
}): LiveHabit {
  return {
    habitType: habit.habitType,
    displayName: habit.displayName,
    severity: habit.severity,
    message: habit.message,
  };
}

async function readMatchup(
  champion: DdragonChampionSummary,
  opponent: DdragonChampionSummary,
  position: string | null
): Promise<LiveMetaMatchup | null> {
  const report = await getMatchupData(
    champion.id,
    opponent.id,
    parsePosition(position) ?? undefined
  );
  if (!report) return null;

  return {
    position: report.position,
    patch: report.patch,
    winRate: report.aWinRateVsB,
    games: report.games,
    verdict: report.verdict,
    hints: report.hints,
  };
}

/**
 * The four metrics the companion can measure off the Live Client Data API while the
 * game is still running.
 *
 * `win_streak` is deliberately absent: it is a fact about a run of games and there is
 * nothing a scoreboard mid-match can say about it. Sending it would put a goal on
 * screen with a progress bar that could not move, which reads as broken rather than as
 * not-applicable — so it is filtered out here and never reaches the app.
 */
const LIVE_MEASURABLE_METRICS = ["cs_per_min", "deaths", "vision_score", "kda"] as const;

function isLiveMeasurable(challenge: ChallengeWithProgress): boolean {
  return (LIVE_MEASURABLE_METRICS as readonly string[]).includes(challenge.metric);
}

/**
 * Drops `championName`: the app already knows what it is playing — it is what it asked
 * about — and a second copy on the wire is one more thing that could disagree with the
 * first.
 */
function toBaseline(baseline: ChampionBaseline): LiveBaseline {
  return {
    games: baseline.games,
    csPerMin: baseline.csPerMin,
    deaths: baseline.deaths,
    visionScore: baseline.visionScore,
    kda: baseline.kda,
  };
}

/**
 * How this champion is built on the current patch, with item ids resolved to names.
 *
 * Names because the app cannot fetch an icon — its content policy allows images from
 * itself and `data:` alone, so a Data Dragon URL would render as a broken frame. An id
 * the catalogue does not carry becomes an empty name rather than dropping the item: a
 * gap in a build is information, and a silently shorter build is not.
 *
 * Null for a mode with no lane. `getChampionBuild` is keyed on a position, and ARAM has
 * none — inventing one would answer with a build for a lane nobody is in.
 */
async function readBuild(
  champion: DdragonChampionSummary,
  position: string | null
): Promise<LiveBuild | null> {
  const lane = parsePosition(position);
  if (!lane) return null;

  const id = championId(champion);
  if (id === null) return null;

  const build = await getChampionBuild(id, lane);
  if (!build) return null;

  const catalogue = await fetchItems().catch(() => new Map<number, ItemInfo>());
  return toLiveBuild(build, catalogue);
}

function toChallenge(challenge: ChallengeWithProgress): LiveChallenge {
  return {
    id: challenge.id,
    metric: challenge.metric,
    targetValue: challenge.targetValue,
    description: challenge.description,
  };
}

/**
 * `riotAccountId` is null when the player has paired a machine but never linked a
 * Riot account. That is a real state with a real fix, so it is reported rather than
 * rendered as an empty dashboard: everything personal goes null and the flag says why.
 *
 * `userId` is the account the challenges belong to. Challenges hang off the user
 * rather than the Riot account, which is why it is a second argument rather than
 * something this service could look up from the first.
 */
export async function getLiveContext(
  riotAccountId: string | null,
  userId: string | null,
  request: LiveContextRequest
): Promise<LiveContext> {
  const roster = await fetchAllChampions();
  const champion = resolve(roster, request.championName);
  const opponent = resolve(roster, request.opponentChampionName);

  const empty: LiveContext = {
    champion: champion ? { key: champion.id, name: champion.name } : null,
    opponent: opponent ? { key: opponent.id, name: opponent.name } : null,
    personal: null,
    meta: null,
    habits: [],
    baseline: null,
    challenges: [],
    build: null,
    riotAccountLinked: riotAccountId !== null,
  };

  if (!champion) return empty;

  const championKey = championId(champion);
  const opponentKey = opponent ? championId(opponent) : null;

  // The six reads are independent and one failing is not a reason to answer with
  // nothing: a snapshot that is briefly unavailable should cost the meta panel and
  // leave the player's own record on screen.
  const [personal, meta, habits, baseline, challenges, build] = await Promise.all([
    riotAccountId && championKey && opponentKey
      ? getPersonalMatchup(riotAccountId, championKey, opponentKey).catch(() => null)
      : null,
    opponent ? readMatchup(champion, opponent, request.position).catch(() => null) : null,
    riotAccountId ? getActiveHabits(riotAccountId).catch(() => []) : [],
    // Keyed on the resolved Data Dragon display name rather than the string the game
    // client sent, which is the same name every other table in this product stores.
    riotAccountId ? getChampionBaseline(riotAccountId, champion.name).catch(() => null) : null,
    userId ? getActiveChallenges(userId).catch(() => []) : [],
    // Not personal, so it is answered whether or not an account is linked: how a
    // champion is built is the same fact for everybody playing it.
    readBuild(champion, request.position).catch(() => null),
  ]);

  return {
    ...empty,
    personal: personal ? toPersonal(personal) : null,
    meta,
    habits: habits.slice(0, MAX_HABITS).map(toHabit),
    baseline: baseline ? toBaseline(baseline) : null,
    challenges: challenges.filter(isLiveMeasurable).map(toChallenge),
    build,
  };
}
