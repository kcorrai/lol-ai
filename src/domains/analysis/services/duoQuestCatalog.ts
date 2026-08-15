/**
 * The weekly duo quests, and which three of them are live in a given week.
 *
 * Deliberately a fixed catalogue rather than AI-generated. Individual challenges cost an AI call
 * each (`challengeGenerationService`); duo quests are per *pair*, so the same spend would scale
 * with pairs rather than players — and a quest like "win three together" needs no creativity to
 * be worth doing. This file has no dependencies and no clock of its own, so a week's quests are
 * reproducible.
 */

/** A shared game, reduced to what a quest can measure. */
export interface QuestMatch {
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  visionScore: number;
  gameStart: Date;
}

export interface QuestDefinition {
  key: string;
  label: string;
  /** What to actually do, in one line. */
  detail: string;
  target: number;
  xpReward: number;
  /** Progress so far, in the same unit as `target`. */
  measure: (matches: readonly QuestMatch[]) => number;
}

/** Longest run of wins in a set of shared games, oldest to newest. */
function longestWinStreak(matches: readonly QuestMatch[]): number {
  const inOrder = [...matches].sort((a, b) => a.gameStart.getTime() - b.gameStart.getTime());

  let best = 0;
  let run = 0;
  for (const m of inOrder) {
    run = m.won ? run + 1 : 0;
    if (run > best) best = run;
  }
  return best;
}

/**
 * Every quest we know how to set. The week picks three; the rest are dormant, not deleted, so a
 * pair sees a different set each week without anything being generated.
 */
export const DUO_QUEST_CATALOG: readonly QuestDefinition[] = [
  {
    key: "games_together",
    label: "Queue up",
    detail: "Play 5 ranked games together this week",
    target: 5,
    xpReward: 60,
    measure: (m) => m.length,
  },
  {
    key: "wins_together",
    label: "Carry each other",
    detail: "Win 3 games together this week",
    target: 3,
    xpReward: 80,
    measure: (m) => m.filter((x) => x.won).length,
  },
  {
    key: "win_streak",
    label: "Back to back",
    detail: "Win 2 games in a row together",
    target: 2,
    xpReward: 70,
    measure: longestWinStreak,
  },
  {
    key: "clean_games",
    label: "Stop dying together",
    detail: "Finish 3 games together on 4 deaths or fewer",
    target: 3,
    xpReward: 90,
    measure: (m) => m.filter((x) => x.deaths <= 4).length,
  },
  {
    key: "vision_games",
    label: "Light it up",
    detail: "Reach 25 vision score in 3 games together",
    target: 3,
    xpReward: 70,
    measure: (m) => m.filter((x) => x.visionScore >= 25).length,
  },
  {
    key: "shared_kills",
    label: "Snowball it",
    detail: "Rack up 40 kills and assists together",
    target: 40,
    xpReward: 60,
    measure: (m) => m.reduce((sum, x) => sum + x.kills + x.assists, 0),
  },
];

/** How many run at once. Three is enough to offer a choice without becoming a checklist. */
export const QUESTS_PER_WEEK = 3;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The Monday 00:00 UTC window containing `now`, matching the weekly reset the individual
 * challenges already use.
 */
export function weekWindow(now: Date): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  );
  // getUTCDay is 0 for Sunday, which is six days *after* the Monday that owns it.
  const daysSinceMonday = (start.getUTCDay() + 6) % 7;
  start.setUTCDate(start.getUTCDate() - daysSinceMonday);

  return { start, end: new Date(start.getTime() + WEEK_MS) };
}

/**
 * The three quests live for a given week.
 *
 * Rotates through the catalogue by week number, so the set is stable for the whole week, changes
 * on Monday, and is identical for every pair — which makes it something two players can talk
 * about, and makes a bug reproducible.
 */
export function questsForWeek(weekStart: Date): QuestDefinition[] {
  const weekIndex = Math.floor(weekStart.getTime() / WEEK_MS);

  return Array.from(
    { length: QUESTS_PER_WEEK },
    (_, i) => DUO_QUEST_CATALOG[(weekIndex + i) % DUO_QUEST_CATALOG.length]!,
  );
}
