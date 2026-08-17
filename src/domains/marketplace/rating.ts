// Turning a handful of ratings into a number worth showing.
//
// Two different numbers, because they answer different questions and a single
// average is wrong for both:
//
//   - **What a profile displays** is a Bayesian average — a mean pulled toward
//     the platform's own average until the sample is real. IMDB has used this
//     shape for decades for the same reason: without it a coach with one
//     five-star review outranks everybody.
//   - **What search orders by** is the lower bound of a Wilson confidence
//     interval. Evan Miller's "How Not To Sort By Average Rating" is the
//     canonical argument: sorting by the mean promotes small samples, and
//     sorting by the count buries good newcomers. The lower bound asks "how bad
//     could this plausibly be", which is the honest question for a ranking.

/** Ratings below this many revealed reviews show no number at all. */
export const MIN_REVIEWS_FOR_SCORE = 3;

/** How much weight the platform average carries before a coach's own reviews outweigh it. */
const PRIOR_WEIGHT = 5;

/** Where a coach with no reviews starts. Not 5, or every new coach would top the list. */
const DEFAULT_PLATFORM_MEAN = 4.5;

const BEST = 5;
const WORST = 1;

/** 1.96 → a 95% confidence interval. */
const Z = 1.96;

/**
 * The score a profile shows.
 *
 * `WR = (v/(v+m))·R + (m/(v+m))·C` — the coach's own mean R with v reviews,
 * pulled toward the platform mean C with weight m.
 */
export function bayesianAverage(
  sum: number,
  count: number,
  platformMean = DEFAULT_PLATFORM_MEAN
): number {
  if (count <= 0) return platformMean;

  const mean = sum / count;
  return (count * mean + PRIOR_WEIGHT * platformMean) / (count + PRIOR_WEIGHT);
}

/**
 * The score search orders by: the lower bound of a Wilson interval.
 *
 * Star ratings are not the yes/no data Wilson was written for, so the ratings
 * are first mapped onto 0..1 — a five is a full yes, a one a full no — and the
 * interval is taken on that proportion. It is the standard adaptation, and it
 * behaves the way the ranking needs: a small sample is pushed down until it has
 * earned its place.
 */
export function wilsonLowerBound(sum: number, count: number): number {
  if (count <= 0) return 0;

  const mean = sum / count;
  const positive = (mean - WORST) / (BEST - WORST);
  const phat = Math.min(1, Math.max(0, positive));

  const z2 = Z * Z;
  const denominator = 1 + z2 / count;
  const centre = phat + z2 / (2 * count);
  const margin = Z * Math.sqrt((phat * (1 - phat) + z2 / (4 * count)) / count);

  return Math.max(0, (centre - margin) / denominator);
}

export interface RatingAggregate {
  /** What the profile displays. Null below the threshold. */
  display: number | null;
  /** What search orders by. Always a number, so ordering never has a hole in it. */
  sort: number;
  count: number;
}

/** Both numbers from a set of revealed ratings. */
export function aggregateRatings(
  ratings: number[],
  platformMean = DEFAULT_PLATFORM_MEAN
): RatingAggregate {
  const count = ratings.length;
  const sum = ratings.reduce((total, rating) => total + rating, 0);

  return {
    display: count >= MIN_REVIEWS_FOR_SCORE ? round(bayesianAverage(sum, count, platformMean)) : null,
    sort: wilsonLowerBound(sum, count),
    count,
  };
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
