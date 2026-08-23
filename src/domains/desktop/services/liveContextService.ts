import { getActiveHabits } from "@/domains/analysis";
import { getPersonalMatchup } from "@/domains/counter";
import { getMatchupData, parsePosition } from "@/domains/meta";
import type {
  LiveContext,
  LiveContextRequest,
  LiveHabit,
  LiveMetaMatchup,
  LivePersonalMatchup,
} from "@/domains/desktop/contract";
import { fetchAllChampions, type DdragonChampionSummary } from "@/lib/ddragon/championsData";

// What the website knows about the game the desktop app is watching (ADR-038, phase 4).
//
// Three reads, each from another domain's public API and none of them new: this
// account's own record in the lane (`counter`), the patch-current snapshot for the
// same pair (`meta`), and the weaknesses already detected from this account's
// matches (`analysis`). Nothing is computed here that the website does not already
// compute for its own pages — the value this adds is that it can be asked for
// during the game, which only a process on the player's machine can do.

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
 * `riotAccountId` is null when the player has paired a machine but never linked a
 * Riot account. That is a real state with a real fix, so it is reported rather than
 * rendered as an empty dashboard: everything personal goes null and the flag says why.
 */
export async function getLiveContext(
  riotAccountId: string | null,
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
    riotAccountLinked: riotAccountId !== null,
  };

  if (!champion) return empty;

  const championKey = championId(champion);
  const opponentKey = opponent ? championId(opponent) : null;

  // The three reads are independent and one failing is not a reason to answer with
  // nothing: a snapshot that is briefly unavailable should cost the meta panel and
  // leave the player's own record on screen.
  const [personal, meta, habits] = await Promise.all([
    riotAccountId && championKey && opponentKey
      ? getPersonalMatchup(riotAccountId, championKey, opponentKey).catch(() => null)
      : null,
    opponent ? readMatchup(champion, opponent, request.position).catch(() => null) : null,
    riotAccountId ? getActiveHabits(riotAccountId).catch(() => []) : [],
  ]);

  return {
    ...empty,
    personal: personal ? toPersonal(personal) : null,
    meta,
    habits: habits.slice(0, MAX_HABITS).map(toHabit),
  };
}
