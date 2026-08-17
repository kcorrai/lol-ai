import { prisma } from "@/lib/db/prisma";
import { utcDateKey } from "@/domains/quiz/services/dailySeed";
import {
  MIN_MATCHES,
  generatePersonalQuestions,
  stripAnswer,
  type PersonalQuestion,
  type PlayedMatch,
} from "@/domains/quiz/services/personalQuestions";

// Loads the history the personal quiz is built from. The generator itself is
// pure and lives in personalQuestions.ts; this file only feeds it.

const LOOKBACK_DAYS = 90;
const MAX_MATCHES = 400;

export interface PersonalQuiz {
  questions: Omit<PersonalQuestion, "answer">[];
  /** Set when there is not enough history yet, so the UI can say what is missing. */
  needsMatches?: { have: number; need: number };
}

async function loadMatches(userId: string, now: Date): Promise<PlayedMatch[]> {
  const account = await prisma.riotAccount.findFirst({
    where: { userId },
    orderBy: { isPrimary: "desc" },
    select: { id: true },
  });
  if (!account) return [];

  const rows = await prisma.matchParticipant.findMany({
    where: {
      riotAccountId: account.id,
      match: { gameStart: { gte: new Date(now.getTime() - LOOKBACK_DAYS * 86_400_000) } },
    },
    select: {
      championName: true,
      position: true,
      won: true,
      kills: true,
      deaths: true,
      assists: true,
      cs: true,
      match: { select: { gameStart: true, gameDuration: true } },
    },
    orderBy: { match: { gameStart: "desc" } },
    take: MAX_MATCHES,
  });

  return rows.map((row) => ({
    championName: row.championName,
    position: row.position,
    won: row.won,
    kills: row.kills,
    deaths: row.deaths,
    assists: row.assists,
    cs: row.cs,
    durationMin: Math.round(row.match.gameDuration / 60),
    playedAt: row.match.gameStart,
  }));
}

/** Today's personal quiz, with the answers stripped. */
export async function getPersonalQuiz(userId: string, now: Date): Promise<PersonalQuiz> {
  const matches = await loadMatches(userId, now);
  if (matches.length < MIN_MATCHES) {
    return { questions: [], needsMatches: { have: matches.length, need: MIN_MATCHES } };
  }
  const questions = generatePersonalQuestions(matches, userId, utcDateKey(now), now);
  return { questions: questions.map(stripAnswer) };
}

export interface PersonalAnswerResult {
  questionId: string;
  correct: boolean;
  answer: string;
}

/**
 * Grades an answer by regenerating the day's questions rather than storing them.
 * Same reasoning as the global modes: the questions are a pure function of the
 * player, the date and their history, so there is nothing worth persisting — and
 * nothing to go stale.
 */
export async function gradePersonalAnswer(
  userId: string,
  questionId: string,
  choice: string,
  now: Date
): Promise<PersonalAnswerResult | null> {
  const matches = await loadMatches(userId, now);
  const questions = generatePersonalQuestions(matches, userId, utcDateKey(now), now);
  const question = questions.find((q) => q.id === questionId);
  if (!question) return null;

  return { questionId, correct: question.answer === choice, answer: question.answer };
}
