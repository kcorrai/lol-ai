// Thresholds and weights for the career timeline, kept together so the judgement
// calls about what counts as an era, a record or a readable month are in one place
// rather than buried in the builders that apply them.

import type { CareerEventKind } from "./careerTimeline.types";

/** How much a reader would miss each kind. Curation cuts from the bottom. */
export const EVENT_WEIGHT: Record<CareerEventKind, number> = {
  peak: 100,
  joined: 95,
  rank_change: 90,
  record: 70,
  champion_era: 60,
  achievement: 50,
  academy: 40,
  habit: 40,
  season: 30,
};

/** Events kept per month. Beyond this a band stops being a story and becomes a log. */
export const EVENTS_PER_BAND = 6;

/** An era shorter than this is a week of trying something, not a period of a career. */
export const MIN_ERA_GAMES = 5;

/** Below this a "personal best" is just the only game on record. */
export const MIN_GAMES_FOR_RECORDS = 5;

/** Two wins is an evening; three starts to be worth remembering. */
export const MIN_STREAK = 3;
