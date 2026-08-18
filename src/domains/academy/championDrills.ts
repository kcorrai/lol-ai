import type { OtpAnalysis, OtpMatchupEntry } from "@/domains/otp";
import type { Drill, DrillOption } from "@/domains/academy/types";

// The drills of a generated champion lesson. The *shapes* are authored here and the analysis
// only fills them in — which is what lets `curriculum.test.ts`'s contract apply to content
// nobody wrote by hand (ADR-030). Every builder returns null rather than a weak drill: half a
// drill teaches nothing and would still be graded.

/** Below this an explanation is not an explanation, and the curriculum contract rejects it. */
const MIN_EXPLAIN = 25;

function usable(text: string | undefined, min = 1): boolean {
  return typeof text === "string" && text.trim().length >= min;
}

function complete(entry: OtpMatchupEntry): boolean {
  return usable(entry.opponent) && usable(entry.summary, 20) && usable(entry.keyTip, 20);
}

function explained(options: DrillOption[]): DrillOption[] | null {
  return options.every((o) => o.explain.trim().length >= MIN_EXPLAIN) ? options : null;
}

/** Distinct opponents, in the order given — the same champion twice would make a quiz unanswerable. */
function distinct(entries: OtpMatchupEntry[]): OtpMatchupEntry[] {
  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = e.opponent.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Tier-list recognition: one lane the champion is favoured in, against three it loses. Wrong
 * answers carry the real summary of the matchup they name, so picking one still teaches the
 * thing the player got wrong.
 */
export function buildTierDrill(champion: string, analysis: OtpAnalysis): Drill | null {
  const easy = distinct(analysis.matchupTierList.easy.filter(complete));
  const hard = distinct(analysis.matchupTierList.hard.filter(complete));
  if (easy.length < 1 || hard.length < 3) return null;

  const options = explained([
    {
      id: "favoured",
      label: easy[0].opponent,
      explain: `Correct — ${easy[0].opponent} is a lane ${champion} is favoured in. ${easy[0].summary}`,
      correct: true,
    },
    ...hard.slice(0, 3).map((entry, i) => ({
      id: `hard-${i}`,
      label: entry.opponent,
      explain: `${entry.opponent} is one of ${champion}'s hard matchups, not a favoured one. ${entry.summary}`,
      correct: false,
    })),
  ]);
  if (!options) return null;

  return {
    id: "champion-tier",
    kind: "quiz",
    prompt: `You are on ${champion}. Which of these lanes are you actually favoured in?`,
    options,
  };
}

/**
 * The plan for the hardest lane, against the plans for three other lanes. Every wrong option is
 * a real tip for a real matchup — so the mistake being corrected is "right idea, wrong lane",
 * which is the mistake players actually make.
 */
export function buildMatchupDrill(champion: string, analysis: OtpAnalysis): Drill | null {
  const { easy, medium, hard } = analysis.matchupTierList;
  const target = distinct(hard.filter(complete))[0];
  if (!target) return null;

  const targetKey = target.opponent.toLowerCase().trim();
  const others = distinct(
    [...medium, ...easy, ...hard]
      .filter(complete)
      .filter((e) => e.opponent.toLowerCase().trim() !== targetKey)
  ).slice(0, 3);
  if (others.length < 3) return null;

  const options = explained([
    {
      id: "target",
      label: target.keyTip,
      explain: `Correct — this is the plan for ${target.opponent} specifically. ${target.summary}`,
      correct: true,
    },
    ...others.map((entry, i) => ({
      id: `other-${i}`,
      label: entry.keyTip,
      explain: `That is the plan for ${entry.opponent}, not ${target.opponent}. Against ${entry.opponent}: ${entry.summary}`,
      correct: false,
    })),
  ]);
  if (!options) return null;

  return {
    id: "champion-matchup",
    kind: "decision",
    situation: `You have locked ${champion} into ${target.opponent}.`,
    facts: [
      `${target.opponent} is one of ${champion}'s hardest lanes`,
      target.summary,
      "All four plans below are real advice — three of them are for a different opponent",
    ],
    options,
  };
}

/**
 * Ban priority as an ordering. This is the one field in the analysis that carries its own
 * sequence — every entry states its priority — so it is the only one that can be graded as an
 * order without inventing a ranking the source never claimed.
 */
export function buildBanDrill(champion: string, analysis: OtpAnalysis): Drill | null {
  const key = (name: string): string => name.toLowerCase().trim();
  const bans = analysis.banPriority
    .filter((b) => usable(b.champion) && usable(b.reason, 15))
    .filter((b, i, all) => all.findIndex((x) => key(x.champion) === key(b.champion)) === i)
    .slice(0, 3);
  if (bans.length < 2) return null;

  const ranked = [...bans].sort((a, b) => a.priority - b.priority);
  return {
    id: "champion-bans",
    kind: "order",
    prompt: `Put these bans in order of how much they matter to a ${champion} player, most first.`,
    items: bans.map((b) => ({ id: key(b.champion), label: b.champion })),
    correctOrder: ranked.map((b) => key(b.champion)),
    explain: ranked.map((b, i) => `${i + 1}. ${b.champion} — ${b.reason}`).join(" "),
  };
}
