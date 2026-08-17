import { fnv1a, seededShuffle } from "@/domains/quiz/services/dailySeed";

// The mode nobody else in this category can build, because nobody else has the
// player's own match history. Questions are generated from it rather than from
// champion trivia: "which of these did you actually play most?" is a question
// only this site can ask.
//
// Pure on purpose — everything here takes plain rows, so the whole generator is
// testable without a database.

export interface PlayedMatch {
  championName: string;
  position: string;
  won: boolean;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  /** Minutes, rounded. */
  durationMin: number;
  playedAt: Date;
}

export type PersonalQuestionKind =
  | "most-played"
  | "did-you-win"
  | "best-winrate"
  | "games-last-week"
  | "most-played-role";

export interface PersonalQuestion {
  id: string;
  kind: PersonalQuestionKind;
  prompt: string;
  /** Shown alongside the prompt for the scoreline question. */
  scoreline?: {
    championName: string;
    kills: number;
    deaths: number;
    assists: number;
    cs: number;
    durationMin: number;
  };
  options: string[];
  /** Server-side only — stripped before the question is sent. */
  answer: string;
}

export const PERSONAL_QUESTION_COUNT = 5;
/** Below this there is not enough history for the questions to be fair. */
export const MIN_MATCHES = 10;

const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
};

function countBy<T>(items: readonly T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) {
    const k = key(item);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

function topOf(counts: Map<string, number>): string | null {
  let best: string | null = null;
  let bestCount = -1;
  // Ties break alphabetically so the same history always yields the same answer.
  for (const [key, count] of [...counts].sort((a, b) => a[0].localeCompare(b[0]))) {
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}

/** Distractors drawn from the player's own history, so no option is obviously absurd. */
function withDistractors(answer: string, pool: string[], seed: number, count = 4): string[] {
  const others = seededShuffle(
    pool.filter((p) => p !== answer),
    seed
  ).slice(0, count - 1);
  return seededShuffle([answer, ...others], seed + 1);
}

function numericOptions(answer: number, seed: number): string[] {
  const spread = Math.max(2, Math.round(answer * 0.4));
  const candidates = new Set<number>([answer]);
  let step = 1;
  while (candidates.size < 4) {
    candidates.add(Math.max(0, answer + spread * step));
    candidates.add(Math.max(0, answer - spread * step));
    step++;
  }
  return seededShuffle([...candidates].slice(0, 4), seed).map(String);
}

function since(matches: readonly PlayedMatch[], now: Date, days: number): PlayedMatch[] {
  const cutoff = now.getTime() - days * 86_400_000;
  return matches.filter((m) => m.playedAt.getTime() >= cutoff);
}

type Builder = (matches: readonly PlayedMatch[], now: Date, seed: number) => PersonalQuestion | null;

const buildMostPlayed: Builder = (matches, now, seed) => {
  const recent = since(matches, now, 30);
  if (recent.length < 5) return null;
  const counts = countBy(recent, (m) => m.championName);
  if (counts.size < 4) return null;
  const answer = topOf(counts);
  if (!answer) return null;
  return {
    id: "most-played",
    kind: "most-played",
    prompt: "Which champion have you played most in the last 30 days?",
    options: withDistractors(answer, [...counts.keys()], seed),
    answer,
  };
};

const buildDidYouWin: Builder = (matches, now, seed) => {
  const recent = since(matches, now, 60);
  if (recent.length === 0) return null;
  const match = seededShuffle(recent, seed)[0];
  return {
    id: "did-you-win",
    kind: "did-you-win",
    prompt: "This is a real scoreline of yours. Did you win?",
    scoreline: {
      championName: match.championName,
      kills: match.kills,
      deaths: match.deaths,
      assists: match.assists,
      cs: match.cs,
      durationMin: match.durationMin,
    },
    options: ["Win", "Loss"],
    answer: match.won ? "Win" : "Loss",
  };
};

const buildBestWinrate: Builder = (matches, _now, seed) => {
  const played = countBy(matches, (m) => m.championName);
  const eligible = [...played].filter(([, count]) => count >= 4).map(([name]) => name);
  if (eligible.length < 4) return null;

  const rate = (name: string): number => {
    const own = matches.filter((m) => m.championName === name);
    return own.filter((m) => m.won).length / own.length;
  };
  // Only ask when there is a clear winner: a 55%-vs-54% question is a coin flip
  // dressed up as knowledge.
  const ranked = eligible.sort((a, b) => rate(b) - rate(a) || a.localeCompare(b));
  if (rate(ranked[0]) - rate(ranked[1]) < 0.15) return null;

  return {
    id: "best-winrate",
    kind: "best-winrate",
    prompt: "Which of these do you actually win most on?",
    options: seededShuffle(ranked.slice(0, 4), seed),
    answer: ranked[0],
  };
};

const buildGamesLastWeek: Builder = (matches, now, seed) => {
  const answer = since(matches, now, 7).length;
  if (answer < 3) return null;
  return {
    id: "games-last-week",
    kind: "games-last-week",
    prompt: "How many games did you play in the last 7 days?",
    options: numericOptions(answer, seed),
    answer: String(answer),
  };
};

const buildMostPlayedRole: Builder = (matches, now, seed) => {
  const recent = since(matches, now, 30);
  if (recent.length < 5) return null;
  const counts = countBy(recent, (m) => ROLE_LABELS[m.position] ?? m.position);
  if (counts.size < 2) return null;
  const answer = topOf(counts);
  if (!answer) return null;
  return {
    id: "most-played-role",
    kind: "most-played-role",
    prompt: "Which role have you played most this month?",
    options: seededShuffle(Object.values(ROLE_LABELS), seed),
    answer,
  };
};

const BUILDERS: Builder[] = [
  buildMostPlayed,
  buildDidYouWin,
  buildBestWinrate,
  buildGamesLastWeek,
  buildMostPlayedRole,
];

/**
 * The day's five questions. Seeded off the player and the date, so the set is
 * fixed for the day and cannot be rerolled by refreshing.
 *
 * A builder returning null means that player's history cannot support that
 * question today — too few games, no clear winner — and it is simply left out
 * rather than asked unfairly.
 */
export function generatePersonalQuestions(
  matches: readonly PlayedMatch[],
  userId: string,
  dateKey: string,
  now: Date
): PersonalQuestion[] {
  if (matches.length < MIN_MATCHES) return [];
  const seed = fnv1a(`personal:${userId}:${dateKey}`);
  return BUILDERS.map((build, index) => build(matches, now, seed + index * 7)).filter(
    (q): q is PersonalQuestion => q !== null
  );
}

/** What the client is allowed to see — everything but the answer. */
export function stripAnswer(question: PersonalQuestion): Omit<PersonalQuestion, "answer"> {
  // Rebuilt field by field rather than destructured: a future field would ride
  // along silently with a rest spread, and this is the one place that matters.
  return {
    id: question.id,
    kind: question.kind,
    prompt: question.prompt,
    ...(question.scoreline ? { scoreline: question.scoreline } : {}),
    options: question.options,
  };
}
