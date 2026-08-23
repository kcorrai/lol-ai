import type { AllGameData, LivePlayer } from "./liveClient/schema";
import type { LiveBaseline, LiveChallenge } from "../../../src/domains/desktop/contract";

/**
 * The player's own four numbers, as they stand right now, against what they normally do
 * and what they said they were working on.
 *
 * Everything here is a fact about the player at this keyboard, read off their own
 * scoreboard. Nothing is derived about anybody else, and nothing tells them what to do:
 * Riot's policy prohibits "notifications that dictate player action based on the current
 * game state", and a coach that describes is on the right side of that line while a coach
 * that instructs is not. "CS/min 6.2, your average is 7.1" is this module's whole voice.
 *
 * No network, no clock of its own, and no game constants — a respawn timer or a power
 * spike would need numbers that change from patch to patch, and a confidently wrong one
 * is worse than an absent one.
 */

export const LIVE_METRICS = ["cs_per_min", "deaths", "vision_score", "kda"] as const;
export type LiveMetric = (typeof LIVE_METRICS)[number];

/** How the live number sits against whatever it is being compared to. */
export type Standing = "above" | "below" | "even" | "unknown";

export interface MetricReading {
  metric: LiveMetric;
  label: string;
  /** What the scoreboard says right now. */
  value: number;
  /** How many decimal places this metric is meaningful to. */
  places: number;
  /** This account's own average on this champion, or null when there is no usable sample. */
  baseline: number | null;
  /** Against the baseline. `unknown` whenever there is no baseline to compare with. */
  vsBaseline: Standing;
  /** The active challenge's target, when one covers this metric. */
  target: number | null;
  /** Against the target. `unknown` when no challenge covers this metric. */
  vsTarget: Standing;
}

const LABELS: Record<LiveMetric, string> = {
  cs_per_min: "CS/min",
  deaths: "Deaths",
  vision_score: "Vision",
  kda: "KDA",
};

const PLACES: Record<LiveMetric, number> = {
  cs_per_min: 1,
  deaths: 0,
  vision_score: 0,
  kda: 2,
};

/**
 * Deaths are the one metric where a smaller number is the better one, so every
 * comparison has to know which way it is pointing. Getting this backwards would tell a
 * player having their best game that they are having their worst.
 */
const LOWER_IS_BETTER: Record<LiveMetric, boolean> = {
  cs_per_min: false,
  deaths: true,
  vision_score: false,
  kda: false,
};

/**
 * Below this the rate is noise: a player two minutes into a game has not had time to
 * miss anything, and dividing by a small number turns one wave into a verdict.
 */
export const MIN_MINUTES_FOR_RATE = 3;

function round(value: number, places: number): number {
  return Number(value.toFixed(places));
}

/**
 * `wardScore` is what the Live Client Data API publishes; `visionScore` is what the
 * match record stores afterwards. They track the same thing and Riot does not publish a
 * conversion between them, so they are compared directly and the panel says "Vision"
 * rather than claiming a precision this does not have.
 */
function liveValue(metric: LiveMetric, me: LivePlayer, minutes: number): number | null {
  const { kills, deaths, assists, creepScore, wardScore } = me.scores;

  switch (metric) {
    case "cs_per_min":
      if (minutes < MIN_MINUTES_FOR_RATE) return null;
      return creepScore / minutes;
    case "deaths":
      return deaths;
    case "vision_score":
      return wardScore;
    case "kda":
      return (kills + assists) / Math.max(deaths, 1);
  }
}

function compare(metric: LiveMetric, value: number, against: number): Standing {
  // A hair either side of a long-run average is the same game, and a reading that
  // flickers between "above" and "below" every poll is one nobody can read.
  const tolerance = Math.max(Math.abs(against) * 0.05, 0.01);
  if (Math.abs(value - against) <= tolerance) return "even";
  const higher = value > against;
  return higher === LOWER_IS_BETTER[metric] ? "below" : "above";
}

/** Minutes elapsed. Riot publishes `gameTime` as seconds, as a float. */
export function minutesElapsed(data: AllGameData): number {
  return Math.max(0, data.gameData.gameTime) / 60;
}

/**
 * Reads the four metrics for one player.
 *
 * A metric with no live value yet — CS/min before the game has run long enough to mean
 * anything — is left out rather than shown as zero. Zero is a claim.
 */
export function readPerformance(
  data: AllGameData,
  me: LivePlayer,
  baseline: LiveBaseline | null,
  challenges: readonly LiveChallenge[]
): MetricReading[] {
  const minutes = minutesElapsed(data);

  const baselines: Record<LiveMetric, number | null> = {
    cs_per_min: baseline?.csPerMin ?? null,
    deaths: baseline?.deaths ?? null,
    vision_score: baseline?.visionScore ?? null,
    kda: baseline?.kda ?? null,
  };

  const readings: MetricReading[] = [];

  for (const metric of LIVE_METRICS) {
    const raw = liveValue(metric, me, minutes);
    if (raw === null) continue;

    const places = PLACES[metric];
    const value = round(raw, places);
    const base = baselines[metric];
    // First match wins: a player is only ever set one goal per metric, and if that ever
    // stops being true the earliest is the one they have had longest.
    const challenge = challenges.find((c) => c.metric === metric) ?? null;

    readings.push({
      metric,
      label: LABELS[metric],
      value,
      places,
      baseline: base,
      vsBaseline: base === null ? "unknown" : compare(metric, raw, base),
      target: challenge?.targetValue ?? null,
      vsTarget: challenge ? compare(metric, raw, challenge.targetValue) : "unknown",
    });
  }

  return readings;
}
