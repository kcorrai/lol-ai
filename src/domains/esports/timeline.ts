import type { GameTimeline, TimelineSample, TimelineTeamState } from "@/domains/esports/types";

/**
 * Reading a sampled walk of a game.
 *
 * Everything here is honest about the sampling. The walk asks the feed for the
 * game's state every four minutes, so it knows a tower fell *between* two
 * samples and not when — every time this module produces is a "by", never an
 * "at", and the components say so.
 */

export type ObjectiveKind = "tower" | "inhibitor" | "dragon" | "baron";

export interface ObjectiveEvent {
  /** Seconds since the game's first frame — the sample this was first seen at. */
  seconds: number;
  side: "blue" | "red";
  kind: ObjectiveKind;
  /** How many of this objective the side gained since the previous sample. */
  count: number;
  /** That side's running total afterwards. */
  total: number;
}

const KINDS: { kind: ObjectiveKind; read: (state: TimelineTeamState) => number }[] = [
  { kind: "tower", read: (state) => state.towers },
  { kind: "inhibitor", read: (state) => state.inhibitors },
  { kind: "dragon", read: (state) => state.dragons },
  { kind: "baron", read: (state) => state.barons },
];

/** Gold lead of the blue side at a sample; negative means red is ahead. */
export function goldDiff(sample: TimelineSample): number {
  return sample.blue.gold - sample.red.gold;
}

/**
 * What changed between one sample and the next.
 *
 * Counts only go up during a game, so a decrease is the feed contradicting
 * itself — a resampled frame from a different game, or a reset the walk should
 * not be inventing a story about. Those are dropped rather than rendered as a
 * team un-taking a baron.
 */
export function objectiveEvents(timeline: GameTimeline): ObjectiveEvent[] {
  const events: ObjectiveEvent[] = [];
  const zero: TimelineTeamState = {
    gold: 0,
    kills: 0,
    towers: 0,
    inhibitors: 0,
    barons: 0,
    dragons: 0,
  };

  let previous: TimelineSample = { seconds: 0, blue: zero, red: zero };

  for (const sample of timeline.samples) {
    for (const side of ["blue", "red"] as const) {
      for (const { kind, read } of KINDS) {
        const gained = read(sample[side]) - read(previous[side]);
        if (gained <= 0) continue;

        events.push({
          seconds: sample.seconds,
          side,
          kind,
          count: gained,
          total: read(sample[side]),
        });
      }
    }
    previous = sample;
  }

  return events;
}

/**
 * The largest gold lead either side held, and when it was first sampled.
 *
 * "Sampled" is the operative word: a lead that peaked and collapsed inside one
 * four-minute window never appears here, and the number is the largest lead the
 * walk actually saw rather than the largest the game contained.
 */
export function peakLead(
  timeline: GameTimeline
): { side: "blue" | "red"; gold: number; seconds: number } | null {
  let best: { side: "blue" | "red"; gold: number; seconds: number } | null = null;

  for (const sample of timeline.samples) {
    const diff = goldDiff(sample);
    const magnitude = Math.abs(diff);
    if (magnitude === 0) continue;
    if (best && magnitude <= best.gold) continue;

    best = { side: diff > 0 ? "blue" : "red", gold: magnitude, seconds: sample.seconds };
  }

  return best;
}

/** "12:00" — the sample's offset into the game. */
export function sampleClock(seconds: number): string {
  const whole = Math.max(0, Math.round(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
