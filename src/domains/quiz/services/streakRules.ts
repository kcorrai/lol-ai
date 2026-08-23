import { dayNumber } from "@/domains/quiz/services/dailySeed";

// The streak rules, kept pure and away from the database so they can be tested
// directly (and so a change here cannot accidentally depend on row state).
//
// Two deliberate departures from LoLdle, whose streak is the most complained
// about thing about it: solving any ONE mode keeps the streak rather than all
// of them, and one missed day a week is forgiven. Losing a two-month streak to
// a single obscure emoji puzzle is the failure this design is avoiding.

export interface StreakState {
  current: number;
  longest: number;
  /** UTC date key, "YYYY-MM-DD". Null before the player's first solve. */
  lastPlayedDate: string | null;
  freezesLeft: number;
  /** ISO week the freeze allowance was last granted for. */
  freezeWeekKey: string | null;
}

export const FREEZES_PER_WEEK = 1;

export const INITIAL_STREAK: StreakState = {
  current: 0,
  longest: 0,
  lastPlayedDate: null,
  freezesLeft: FREEZES_PER_WEEK,
  freezeWeekKey: null,
};

/**
 * ISO-8601 week key, "2026-W34". Weeks run Monday to Sunday, so a freeze granted
 * on Sunday does not silently refill the next morning.
 */
export function isoWeekKey(dateKey: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  // Shift to the Thursday of this week: the ISO year is whichever year that
  // Thursday falls in, which is what makes week 1 well defined at year borders.
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const isoYear = date.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDay = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDay + 3);
  const week = 1 + Math.round((date.getTime() - firstThursday.getTime()) / (7 * 86_400_000));
  return `${isoYear}-W${String(week).padStart(2, "0")}`;
}

/** A new week refills the allowance; the same week leaves it alone. */
function withFreezeAllowance(state: StreakState, dateKey: string): StreakState {
  const week = isoWeekKey(dateKey);
  if (state.freezeWeekKey === week) return state;
  return { ...state, freezesLeft: FREEZES_PER_WEEK, freezeWeekKey: week };
}

/**
 * Applies a solve on `dateKey` to the player's streak.
 *
 * Idempotent for a day already counted, so solving a second mode on the same day
 * does not advance the streak twice.
 */
export function advanceStreak(previous: StreakState, dateKey: string): StreakState {
  const state = withFreezeAllowance(previous, dateKey);

  if (state.lastPlayedDate === dateKey) return state;

  // A date before the last recorded one is a clock skew or a backfill, not a
  // play — leave the streak alone rather than corrupting it.
  if (state.lastPlayedDate && dayNumber(dateKey) < dayNumber(state.lastPlayedDate)) {
    return state;
  }

  const gap = state.lastPlayedDate
    ? dayNumber(dateKey) - dayNumber(state.lastPlayedDate)
    : Infinity;

  let current: number;
  let freezesLeft = state.freezesLeft;

  if (gap === 1) {
    current = state.current + 1;
  } else if (gap === 2 && freezesLeft > 0) {
    // Exactly one day missed, and there is an allowance to spend on it.
    current = state.current + 1;
    freezesLeft -= 1;
  } else {
    current = 1;
  }

  return {
    current,
    longest: Math.max(state.longest, current),
    lastPlayedDate: dateKey,
    freezesLeft,
    freezeWeekKey: state.freezeWeekKey,
  };
}

/**
 * Whether a streak is still alive as of `today`, without recording anything.
 * A streak survives one missed day when a freeze is available, so the panel can
 * say "at risk" instead of showing a number that is about to vanish.
 */
export function streakStatus(state: StreakState, today: string): "current" | "at-risk" | "broken" {
  if (!state.lastPlayedDate || state.current === 0) return "broken";
  const gap = dayNumber(today) - dayNumber(state.lastPlayedDate);
  if (gap <= 0) return "current";
  if (gap === 1) return "at-risk";
  if (gap === 2 && state.freezesLeft > 0) return "at-risk";
  return "broken";
}
