import type { BracketMatch } from "@/domains/esports/types";

export interface BracketRound {
  /** 1-based. Round 1 is everything nobody had to win a game to reach. */
  number: number;
  /** "Quarterfinals", "Semifinals", "Final" when the shape says so; null otherwise. */
  name: string | null;
  matches: BracketMatch[];
}

export interface BracketLayout {
  rounds: BracketRound[];
  /**
   * False when the rounds could not be worked out and the matches are simply
   * listed. True is the caller's licence to draw a bracket.
   */
  derived: boolean;
}

/**
 * Names the last rounds of a single-elimination bracket, counting backwards.
 *
 * Only applied when the round sizes actually halve to one, because "Semifinals"
 * on a stage that is not a knockout is a lie the layout would tell confidently.
 */
const FINAL_ROUND_NAMES = ["Final", "Semifinals", "Quarterfinals"];

function looksSingleElimination(sizes: number[]): boolean {
  if (sizes.length < 2 || sizes[sizes.length - 1] !== 1) return false;
  return sizes.every((size, index) => index === 0 || size * 2 === sizes[index - 1]);
}

function nameRounds(rounds: BracketRound[]): BracketRound[] {
  const sizes = rounds.map((round) => round.matches.length);
  if (!looksSingleElimination(sizes)) return rounds;

  return rounds.map((round, index) => ({
    ...round,
    name: FINAL_ROUND_NAMES[rounds.length - 1 - index] ?? null,
  }));
}

/**
 * Works out which matches belong to which round of a bracket.
 *
 * The feed does not say. `previousMatchIds` exists on every bracket match and is
 * **empty on every one of them** — checked across Worlds 2011 through 2026, MSI,
 * LCK, LEC and LCP — so the wiring a bracket needs has to come from somewhere
 * else. What the feed does give is who played and, through the schedule, when.
 *
 * So a round is derived from continuity: a match is one round later than the
 * latest match any of its teams already appeared in. A team can only reach the
 * semi-final by playing the quarter-final, and that is the same fact a connector
 * line draws.
 *
 * Undecided slots carry no team to trace, so a stage whose draw has not been
 * made yet cannot be laid out at all — `derived: false` says so rather than
 * dropping seven "TBD vs TBD" matches into one meaningless first round.
 */
export function bracketLayout(
  matches: BracketMatch[],
  startTimes: Map<string, string>
): BracketLayout {
  if (matches.length === 0) return { rounds: [], derived: false };

  const ordered = [...matches].sort((a, b) => {
    const aTime = startTimes.get(a.matchId);
    const bTime = startTimes.get(b.matchId);
    // Matches the schedule window no longer covers keep their feed order, which
    // is the order the organiser published them in.
    if (aTime && bTime && aTime !== bTime) return aTime.localeCompare(bTime);
    if (aTime && !bTime) return 1;
    if (!aTime && bTime) return -1;
    return 0;
  });

  const roundOf = new Map<string, number>();
  const lastRoundForTeam = new Map<string, number>();
  let decidedMatches = 0;

  for (const match of ordered) {
    const teams = match.teams.filter((team) => team.decided);
    if (teams.length > 0) decidedMatches += 1;

    const from = teams.map((team) => lastRoundForTeam.get(team.id) ?? 0);
    const round = Math.max(0, ...from) + 1;

    roundOf.set(match.matchId, round);
    for (const team of teams) lastRoundForTeam.set(team.id, round);
  }

  // Nothing decided means nothing to trace, and a single round holding every
  // match is not a bracket.
  if (decidedMatches === 0) {
    return { rounds: [{ number: 1, name: null, matches: ordered }], derived: false };
  }

  const byRound = new Map<number, BracketMatch[]>();
  for (const match of ordered) {
    const round = roundOf.get(match.matchId) ?? 1;
    byRound.set(round, [...(byRound.get(round) ?? []), match]);
  }

  const rounds: BracketRound[] = [...byRound.entries()]
    .sort(([a], [b]) => a - b)
    .map(([number, roundMatches]) => ({ number, name: null, matches: roundMatches }));

  return { rounds: nameRounds(rounds), derived: rounds.length > 1 };
}

/** The team that won a decided bracket match, or null while it is undecided. */
export function bracketWinner(match: BracketMatch): BracketMatch["teams"][number] | null {
  return match.teams.find((team) => team.outcome === "win") ?? null;
}
