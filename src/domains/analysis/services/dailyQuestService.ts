// TODAY'S QUEST — the one thing to do today, shown the moment a player lands.
//
// Two objectives, deliberately: the in-game leg is the existing daily challenge
// (a real metric goal off their own weakest stat), and the on-site leg is
// something finishable without queuing. A quest that can only be finished by
// playing three ranked games is a quest that is unfinished on most days, which
// makes the streak meaningless.

import { getActiveChallenges } from "./challengeProgressService";
import type { ChallengeWithProgress } from "./challengeConstants";
import { TEMPLATES } from "./challengeConstants";
import type { ChallengeMetric } from "./challengeConstants";
import { dayWindow, pickOnSiteTask, questDateKey, shiftDateKey } from "./dailyQuestCatalog";
import { loadQuestSignals } from "./dailyQuestSignals";
import type { QuestSignals } from "./dailyQuestSignals";

/** How far back the streak is willing to look. Longer costs nothing to read but
 *  means holding more day keys in memory for a number nobody displays past 30. */
export const STREAK_WINDOW_DAYS = 30;

export type QuestObjectiveKind = "in_game" | "on_site";

export interface QuestObjective {
  kind: QuestObjectiveKind;
  id: string;
  title: string;
  hint: string;
  href: string;
  ctaLabel: string;
  xpReward: number;
  /** 0..1. The on-site leg is binary; the in-game leg tracks the challenge. */
  progress: number;
  completed: boolean;
}

export interface DailyQuest {
  dateKey: string;
  objectives: QuestObjective[];
  /** Every issued objective done. This is what advances the streak. */
  completed: boolean;
  streak: number;
  xpReward: number;
  expiresAt: Date;
}

function inGameObjective(challenge: ChallengeWithProgress): QuestObjective {
  const template = TEMPLATES[challenge.metric as ChallengeMetric];
  return {
    kind: "in_game",
    id: challenge.metric,
    title: challenge.description,
    hint: `Ranked Solo/Duo · ${template?.matchCount ?? 3} games today`,
    href: "/improvement",
    ctaLabel: "Drill this",
    xpReward: challenge.xpReward,
    progress: challenge.progress,
    completed: challenge.completed,
  };
}

/**
 * A day counts when every objective issued *that* day was finished. The
 * in-game leg only counts against a day it was actually issued on — a player
 * with no Riot account linked yet still has a quest, and still has a streak.
 */
export function isQuestDone(userId: string, dateKey: string, signals: QuestSignals): boolean {
  const task = pickOnSiteTask(userId, dateKey);
  if (!signals.onSite[task.id].has(dateKey)) return false;
  if (!signals.challengeIssued.has(dateKey)) return true;
  return signals.challengeDone.has(dateKey);
}

/**
 * Today is graded but never fatal: an unfinished quest at 09:00 is not a broken
 * streak, it is a quest in progress. The run therefore starts breaking at
 * yesterday, which is the last day a player can no longer do anything about.
 */
export function computeQuestStreak(
  userId: string,
  todayKey: string,
  signals: QuestSignals
): number {
  let streak = 0;
  for (let i = 0; i < STREAK_WINDOW_DAYS; i++) {
    const key = shiftDateKey(todayKey, -i);
    if (isQuestDone(userId, key, signals)) {
      streak++;
      continue;
    }
    if (i === 0) continue;
    break;
  }
  return streak;
}

export async function getDailyQuest(userId: string, now: Date = new Date()): Promise<DailyQuest> {
  const dateKey = questDateKey(now);
  const { end } = dayWindow(dateKey);
  const since = dayWindow(shiftDateKey(dateKey, -(STREAK_WINDOW_DAYS - 1))).start;

  const [challenges, signals] = await Promise.all([
    getActiveChallenges(userId),
    loadQuestSignals(userId, since),
  ]);

  const task = pickOnSiteTask(userId, dateKey);
  const onSiteDone = signals.onSite[task.id].has(dateKey);

  const objectives: QuestObjective[] = [];

  // The in-game leg is whatever daily challenge the generator issued. It is not
  // re-derived here: two places deciding what today's metric goal is would
  // eventually disagree, and the widget would contradict the challenge card.
  const daily = challenges.find((c) => c.type === "daily");
  if (daily) objectives.push(inGameObjective(daily));

  objectives.push({
    kind: "on_site",
    id: task.id,
    title: task.title,
    hint: task.hint,
    href: task.href,
    ctaLabel: task.ctaLabel,
    xpReward: task.xpReward,
    progress: onSiteDone ? 1 : 0,
    completed: onSiteDone,
  });

  return {
    dateKey,
    objectives,
    completed: objectives.every((o) => o.completed),
    streak: computeQuestStreak(userId, dateKey, signals),
    xpReward: objectives.reduce((sum, o) => sum + o.xpReward, 0),
    expiresAt: end,
  };
}
