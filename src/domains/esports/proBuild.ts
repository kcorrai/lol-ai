import { kdaRatio } from "@/lib/kda";
import { meanDuration, perMinute } from "@/domains/esports/duration";
import { gameWinner } from "@/domains/esports/gameOutcome";
import type {
  GameParticipant,
  GameTeamStats,
  ItemFrequency,
  ProChampionAverages,
  ProChampionBuild,
  ProGameAppearance,
  ProPlayerOnChampion,
  RuneVariant,
  SampledGame,
} from "@/domains/esports/types";

/**
 * Cheapest item that counts as part of a build.
 *
 * The feed publishes the final inventory, trinket and leftovers included. Gold
 * cost is the cleanest discriminator for the cheap end: trinkets are free,
 * potions 50, control wards 75, refillables 150. 500 clears all of them and
 * keeps every pair of boots worth finishing.
 *
 * The expensive end needs the other test — see `BuildItemCatalogue`. A game
 * that ended while someone was holding a B. F. Sword should not report a
 * B. F. Sword as part of how pros build the champion.
 */
export const MIN_BUILD_ITEM_GOLD = 500;

/**
 * How often an item has to appear before it is called part of the build.
 *
 * Without this, one player's one-off pick sits in the list beside an item
 * fifteen of eighteen games finished on, reading as though the two carried the
 * same weight.
 */
const MIN_ITEM_SHARE = 0.15;

/** What `aggregateProBuilds` needs to know about an item. */
export interface BuildItemFacts {
  gold: number;
  /** False for components — anything that builds into something else. */
  finished: boolean;
  /** Potions, elixirs, control wards. Held at the final whistle, not built. */
  consumable: boolean;
}

export type BuildItemCatalogue = Map<number, BuildItemFacts>;

/**
 * A level is only claimed when a strict majority of the sample took the same
 * skill there. An even split is not a consensus, and printing one side of it
 * would be inventing an answer the games did not give.
 */
const SKILL_MAJORITY = 0.5;

const TOP_ITEMS = 8;
const TOP_RUNE_PAGES = 3;
const TOP_PLAYERS = 5;
const RECENT_GAMES = 6;

function frequencies<T>(items: T[], key: (item: T) => string): Map<string, { value: T; count: number }> {
  const counts = new Map<string, { value: T; count: number }>();
  for (const item of items) {
    const id = key(item);
    const existing = counts.get(id);
    if (existing) existing.count += 1;
    else counts.set(id, { value: item, count: 1 });
  }
  return counts;
}

/**
 * The levelling order pros agree on, and where they stop agreeing.
 *
 * Reported level by level rather than as a whole-sequence mode: two teams that
 * differ only at level 13 should still produce one readable order for the first
 * twelve, which is the part anyone is reading it for. The order is truncated at
 * the first level where the sample splits.
 */
function consensusSkillOrder(orders: string[][]): string[] {
  const usable = orders.filter((order) => order.length > 0);
  if (usable.length === 0) return [];

  const consensus: string[] = [];
  const longest = Math.max(...usable.map((order) => order.length));

  for (let level = 0; level < longest; level += 1) {
    const atLevel = usable.map((order) => order[level]).filter(Boolean);
    if (atLevel.length === 0) break;

    const counts = frequencies(atLevel, (key) => key);
    const [best] = [...counts.values()].sort((a, b) => b.count - a.count);
    if (best.count / atLevel.length <= SKILL_MAJORITY) break;

    consensus.push(best.value);
  }

  return consensus;
}

function buildItems(
  participants: GameParticipant[],
  catalogue: BuildItemCatalogue
): ItemFrequency[] {
  const counts = new Map<number, number>();

  for (const participant of participants) {
    // One count per game per item, not per copy in the inventory.
    for (const itemId of new Set(participant.items)) {
      const facts = catalogue.get(itemId);
      if (!facts) continue;
      if (facts.consumable || !facts.finished || facts.gold < MIN_BUILD_ITEM_GOLD) continue;
      counts.set(itemId, (counts.get(itemId) ?? 0) + 1);
    }
  }

  const floor = Math.max(1, Math.ceil(participants.length * MIN_ITEM_SHARE));

  return [...counts.entries()]
    .filter(([, games]) => games >= floor)
    .map(([itemId, games]) => ({ itemId, games }))
    .sort((a, b) => b.games - a.games || a.itemId - b.itemId)
    .slice(0, TOP_ITEMS);
}

/**
 * Rune pages, grouped the way a reader would group them.
 *
 * Keying on the exact perk list splits one setup into three rows that render
 * identically — same keystone, same two trees — because they differ only in a
 * minor rune or a shard. Grouping on keystone and trees instead gives rows a
 * reader can tell apart, and the perk list shown for each is the most common
 * one inside its group rather than an average of them.
 */
function runePages(entries: { participant: GameParticipant; won: boolean | null }[]): RuneVariant[] {
  interface Group {
    variant: RuneVariant;
    perkCounts: Map<string, { perks: number[]; count: number }>;
  }
  const groups = new Map<string, Group>();

  for (const { participant, won } of entries) {
    const runes = participant.runes;
    if (!runes || runes.perks.length === 0) continue;

    const keystone = runes.perks[0];
    const key = `${runes.primaryStyle}|${runes.secondaryStyle}|${keystone}`;
    const perkKey = runes.perks.join(",");

    const group = groups.get(key) ?? {
      variant: {
        primaryStyle: runes.primaryStyle,
        secondaryStyle: runes.secondaryStyle,
        perks: runes.perks,
        games: 0,
        wins: 0,
      },
      perkCounts: new Map(),
    };

    group.variant.games += 1;
    if (won) group.variant.wins += 1;

    const seen = group.perkCounts.get(perkKey);
    if (seen) seen.count += 1;
    else group.perkCounts.set(perkKey, { perks: runes.perks, count: 1 });

    groups.set(key, group);
  }

  return [...groups.values()]
    .map((group) => {
      const [mostCommon] = [...group.perkCounts.values()].sort((a, b) => b.count - a.count);
      return { ...group.variant, perks: mostCommon.perks };
    })
    .sort((a, b) => b.games - a.games)
    .slice(0, TOP_RUNE_PAGES);
}

function teamNames(
  game: SampledGame,
  team: GameTeamStats
): { own: string | null; opponent: string | null } {
  return team.side === "blue"
    ? { own: game.blueTeamName, opponent: game.redTeamName }
    : { own: game.redTeamName, opponent: game.blueTeamName };
}

interface Appearance {
  game: SampledGame;
  team: GameTeamStats;
  participant: GameParticipant;
  won: boolean | null;
}

function appearances(games: SampledGame[]): Map<string, Appearance[]> {
  const byChampion = new Map<string, Appearance[]>();

  for (const game of games) {
    if (!game.stats.finished) continue;
    const winner = gameWinner(game.stats);

    for (const team of [game.stats.blue, game.stats.red]) {
      const won = winner === null ? null : team.side === winner;

      for (const participant of team.participants) {
        const list = byChampion.get(participant.championId) ?? [];
        list.push({ game, team, participant, won });
        byChampion.set(participant.championId, list);
      }
    }
  }

  return byChampion;
}

function toAppearance(entry: Appearance): ProGameAppearance {
  const names = teamNames(entry.game, entry.team);
  return {
    matchId: entry.game.matchId,
    gameNumber: entry.game.gameNumber,
    leagueName: entry.game.leagueName,
    handle: entry.participant.handle,
    teamName: names.own,
    opponentName: names.opponent,
    kills: entry.participant.kills,
    deaths: entry.participant.deaths,
    assists: entry.participant.assists,
    creepScore: entry.participant.creepScore,
    items: entry.participant.items,
    won: entry.won,
  };
}

/** Mean of the values that are actually present, or null when none are. */
function meanOf(values: (number | null)[]): number | null {
  const present = values.filter((value): value is number => value !== null);
  if (present.length === 0) return null;
  return present.reduce((sum, value) => sum + value, 0) / present.length;
}

function averages(entries: Appearance[]): ProChampionAverages {
  const players = entries.map((entry) => entry.participant);
  const mean = (pick: (p: GameParticipant) => number): number =>
    players.length === 0 ? 0 : players.reduce((sum, p) => sum + pick(p), 0) / players.length;

  const kills = mean((p) => p.kills);
  const deaths = mean((p) => p.deaths);
  const assists = mean((p) => p.assists);
  const decided = entries.filter((entry) => entry.won !== null);

  // Averaged over the per-game rates rather than dividing the mean total by the
  // mean length: a 20-minute stomp and a 45-minute grind contribute one reading
  // each that way, which is how a farm figure is read, instead of the long game
  // quietly counting more than twice as much as the short one.
  const rate = (pick: (p: GameParticipant) => number): number | null =>
    meanOf(
      entries.map((entry) => perMinute(pick(entry.participant), entry.game.stats.durationSeconds))
    );

  return {
    kills,
    deaths,
    assists,
    kda: kdaRatio(kills, deaths, assists),
    creepScore: mean((p) => p.creepScore),
    gold: mean((p) => p.gold),
    gameLengthSeconds: meanDuration(entries.map((entry) => entry.game.stats.durationSeconds)),
    creepScorePerMin: rate((p) => p.creepScore),
    goldPerMin: rate((p) => p.gold),
    wardsPlaced: meanOf(players.map((p) => p.wardsPlaced)),
    wardsDestroyed: meanOf(players.map((p) => p.wardsDestroyed)),
    killParticipation: meanOf(players.map((p) => p.killParticipation)),
    damageShare: meanOf(players.map((p) => p.damageShare)),
    winRate:
      decided.length === 0
        ? 0
        : (decided.filter((entry) => entry.won === true).length / decided.length) * 100,
  };
}

function topPlayers(entries: Appearance[]): ProPlayerOnChampion[] {
  const players = new Map<string, ProPlayerOnChampion>();

  for (const entry of entries) {
    const handle = entry.participant.handle;
    const existing = players.get(handle);
    if (existing) {
      existing.games += 1;
      if (entry.won) existing.wins += 1;
    } else {
      players.set(handle, {
        handle,
        teamName: teamNames(entry.game, entry.team).own,
        games: 1,
        wins: entry.won ? 1 : 0,
      });
    }
  }

  return [...players.values()]
    .sort((a, b) => b.games - a.games || b.wins - a.wins || a.handle.localeCompare(b.handle))
    .slice(0, TOP_PLAYERS);
}

/**
 * How pros finished each champion in the sample.
 *
 * Items are the *final* inventory: the feed publishes what a player ended the
 * game holding, not the order they bought it in, so nothing here claims a build
 * order. Skill order is the one sequence the feed does publish.
 */
export function aggregateProBuilds(
  games: SampledGame[],
  items: BuildItemCatalogue
): Record<string, ProChampionBuild> {
  const builds: Record<string, ProChampionBuild> = {};

  for (const [championId, entries] of appearances(games)) {
    const recent = [...entries].sort((a, b) =>
      b.game.stats.lastFrameAt.localeCompare(a.game.stats.lastFrameAt)
    );
    const skillOrders = entries.map((entry) => entry.participant.abilities);

    builds[championId] = {
      championId,
      games: entries.length,
      wins: entries.filter((entry) => entry.won === true).length,
      averages: averages(entries),
      items: buildItems(
        entries.map((entry) => entry.participant),
        items
      ),
      runes: runePages(entries),
      skillOrder: consensusSkillOrder(skillOrders),
      skillOrderGames: skillOrders.filter((order) => order.length > 0).length,
      topPlayers: topPlayers(entries),
      recentGames: recent.slice(0, RECENT_GAMES).map(toAppearance),
    };
  }

  return builds;
}
