import { bracketWinner } from "@/domains/esports/bracket";
import type {
  BracketMatch,
  BracketTeam,
  EsportsLeague,
  EsportsTournament,
  StandingsStage,
} from "@/domains/esports/types";

/**
 * Reading a tournament's name, dates and state the way a fan says them.
 *
 * Every date here is a calendar day as the feed publishes it ("2026-07-23"),
 * not an instant, so it is compared as a string and formatted in UTC — shifting
 * it into a reader's zone would move a split's first day to the day before.
 */

export type TournamentState = "upcoming" | "running" | "ended";

/** A tournament with the league it belongs to. */
export interface TournamentWithLeague {
  tournament: EsportsTournament;
  league: EsportsLeague;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function titleCase(value: string): string {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .trim();
}

/**
 * A tournament's name, as a reader writes it.
 *
 * Feed slugs are machine-shaped ("lck_split_2_2026") and title-casing them
 * alone produces "Lck Split 2 2026" — every league acronym mangled. The slug
 * usually opens with the league's own slug, so that prefix is swapped for the
 * league's real name and only the rest is title-cased.
 */
export function tournamentName(tournament: EsportsTournament, league: EsportsLeague): string {
  const slug = tournament.slug.toLowerCase();
  const prefix = league.slug.toLowerCase();

  if (slug === prefix) return league.name;
  if (slug.startsWith(`${prefix}_`) || slug.startsWith(`${prefix}-`)) {
    return `${league.name} ${titleCase(slug.slice(prefix.length + 1))}`.trim();
  }

  return titleCase(tournament.slug);
}

/** Today as the feed writes a date: YYYY-MM-DD in UTC. */
export function isoDay(now: Date): string {
  return now.toISOString().slice(0, 10);
}

export function tournamentState(tournament: EsportsTournament, today: string): TournamentState {
  if (tournament.startDate && tournament.startDate > today) return "upcoming";
  if (tournament.endDate && tournament.endDate < today) return "ended";
  return "running";
}

function parseDay(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}

/** Whole days from one calendar day to another; negative when `to` is earlier. */
export function daysBetween(from: string, to: string): number {
  return Math.round((parseDay(to).getTime() - parseDay(from).getTime()) / DAY_MS);
}

/**
 * Spelled out rather than taken from `toLocaleDateString`: ICU versions differ
 * on "Sep" versus "Sept", and a server and browser that disagree turn every
 * date on the page into a hydration mismatch.
 */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDate(day: string, withYear: boolean): string {
  const date = parseDay(day);
  const base = `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]}`;
  return withYear ? `${base} ${date.getUTCFullYear()}` : base;
}

/**
 * "23 Jul – 20 Sep 2026", with the year said once when both ends share it.
 * Empty when the feed published neither bound.
 */
export function formatTournamentDates(tournament: EsportsTournament): string {
  const { startDate, endDate } = tournament;
  if (startDate && endDate) {
    const sameYear = startDate.slice(0, 4) === endDate.slice(0, 4);
    return `${shortDate(startDate, !sameYear)} – ${shortDate(endDate, true)}`;
  }
  if (startDate) return `From ${shortDate(startDate, true)}`;
  if (endDate) return `Until ${shortDate(endDate, true)}`;
  return "";
}

function inDays(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

/**
 * Where the tournament sits against today, in one short phrase: "Starts in 23
 * days", "Ends tomorrow", "Ended 7 days ago". Empty when the dates cannot say.
 */
export function relativeTiming(tournament: EsportsTournament, today: string): string {
  const { startDate, endDate } = tournament;
  const state = tournamentState(tournament, today);

  if (state === "upcoming" && startDate) return `Starts ${inDays(daysBetween(today, startDate))}`;
  if (state === "running") return endDate ? `Ends ${inDays(daysBetween(today, endDate))}` : "";
  if (state === "ended" && endDate) {
    const ago = daysBetween(endDate, today);
    return ago === 1 ? "Ended yesterday" : `Ended ${ago} days ago`;
  }
  return "";
}

/**
 * How far through a running tournament today is: day 12 of 73. Null when either
 * bound is missing, because a progress bar with an assumed end is a guess.
 */
export function tournamentProgress(
  tournament: EsportsTournament,
  today: string
): { day: number; of: number } | null {
  const { startDate, endDate } = tournament;
  if (!startDate || !endDate) return null;
  const of = daysBetween(startDate, endDate) + 1;
  const day = Math.min(of, Math.max(1, daysBetween(startDate, today) + 1));
  return { day, of };
}

/**
 * Tournaments split by where they sit against today.
 *
 * Running ones are ordered by which ends first, upcoming ones by which starts
 * first, and finished ones newest first — the order each question is asked in.
 */
export function groupTournaments<T extends { tournament: EsportsTournament }>(
  entries: T[],
  today: string
): { running: T[]; upcoming: T[]; finished: T[] } {
  const running: T[] = [];
  const upcoming: T[] = [];
  const finished: T[] = [];

  for (const entry of entries) {
    const state = tournamentState(entry.tournament, today);
    if (state === "running") running.push(entry);
    else if (state === "upcoming") upcoming.push(entry);
    else finished.push(entry);
  }

  const start = (entry: T): string => entry.tournament.startDate ?? "";
  // A running split with no end date sorts last rather than first.
  const end = (entry: T): string => entry.tournament.endDate ?? "9999";

  return {
    running: running.sort((a, b) => end(a).localeCompare(end(b))),
    upcoming: upcoming.sort((a, b) => start(a).localeCompare(start(b))),
    finished: finished.sort((a, b) => end(b).localeCompare(end(a))),
  };
}

export interface TournamentChampion {
  winner: BracketTeam;
  runnerUp: BracketTeam | null;
  /** "3–0", winner's games first. */
  score: string;
  matchId: string;
  /** The stage the deciding match was played in, e.g. "Playoffs". */
  stageName: string;
}

/**
 * Stages that are played *after* or *alongside* the title but do not decide it.
 *
 * LPL Split 3 2026 ends with a "Regional Qualifier" for Worlds after its
 * Playoffs final, and taking the last bracket stage named that qualifier's
 * winner as the split's champion. Play-ins come before the real bracket.
 */
const NOT_THE_TITLE = /play-?in|qualifier/i;

/**
 * Who won the tournament: the last decided match of the last stage that
 * decides the title.
 *
 * The caller only asks this of a tournament that has ended — the "final" of a
 * running bracket is a match nobody has played yet.
 */
export function tournamentChampion(stages: StandingsStage[]): TournamentChampion | null {
  const brackets = stages.filter(
    (stage): stage is Extract<StandingsStage, { kind: "bracket" }> =>
      stage.kind === "bracket" && !NOT_THE_TITLE.test(`${stage.stageName} ${stage.sectionName}`)
  );
  const stage = brackets[brackets.length - 1];
  if (!stage) return null;

  const final: BracketMatch | undefined = [...stage.matches]
    .reverse()
    .find((match) => bracketWinner(match) !== null);
  if (!final) return null;

  const winner = bracketWinner(final);
  if (!winner) return null;
  const runnerUp = final.teams.find((team) => team !== winner) ?? null;

  return {
    winner,
    runnerUp,
    score: `${winner.gameWins}–${runnerUp?.gameWins ?? 0}`,
    matchId: final.matchId,
    stageName: stage.stageName,
  };
}
