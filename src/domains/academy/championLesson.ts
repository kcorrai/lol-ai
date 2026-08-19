import type { OtpAnalysis } from "@/domains/otp";
import { buildBanDrill, buildMatchupDrill, buildTierDrill } from "@/domains/academy/championDrills";
import { ROLE_LABEL } from "@/domains/academy/roles";
import type { Drill, FieldAssignment, Lesson, LessonBlock, RoleId } from "@/domains/academy/types";

// A champion lesson is generated from `OtpAnalysis` rather than written. The generator is a
// pure function so the curriculum contract can be applied to its output exactly as it is to an
// authored lesson — see ADR-030, and `championLesson.test.ts`, which runs that contract over a
// fixture. Nothing here reaches the network or the database.

/**
 * The one track id with no `Track` behind it. Champion lessons are per player and per champion,
 * so they are never in the registry — which is safe only because `academy_progress.lessonId` is
 * a free string and deliberately not a foreign key (ADR-025).
 */
export const CHAMPION_TRACK_ID = "champion";

/** Data Dragon names carry spaces, apostrophes and full stops; URLs and ids carry none. */
export function championSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function championLessonId(champion: string, role: RoleId): string {
  return `${CHAMPION_TRACK_ID}/${championSlug(champion)}-${role}`;
}

function usable(text: string | undefined, min = 1): boolean {
  return typeof text === "string" && text.trim().length >= min;
}

/**
 * The metric a lesson about this champion can honestly ask for. A support has no CS to move and
 * a jungler's is camps, so the assignment asks each role for the number its own games produce.
 */
const ASSIGNMENT: Record<RoleId, Omit<FieldAssignment, "instruction">> = {
  top: { metric: "csPerMinute", direction: "increase", delta: 0.4, games: 3 },
  jungle: { metric: "killParticipation", direction: "increase", delta: 4, games: 3 },
  mid: { metric: "csPerMinute", direction: "increase", delta: 0.4, games: 3 },
  adc: { metric: "csPerMinute", direction: "increase", delta: 0.4, games: 3 },
  support: { metric: "visionScore", direction: "increase", delta: 4, games: 3 },
};

function assignment(champion: string, role: RoleId, hardest: string | null): FieldAssignment {
  const opponent = hardest ? ` Ban or respect ${hardest}.` : "";
  return {
    ...ASSIGNMENT[role],
    instruction: `Next 3 ranked games on ${champion}: play the matchup you drew by the plan in this lesson rather than by feel, and hold your power spikes rather than fighting before them.${opponent}`,
  };
}

interface ChampionLessonInput {
  champion: string;
  role: RoleId;
  analysis: OtpAnalysis;
  /**
   * Data Dragon's numeric key, which is the only thing an ability clip needs. Optional because
   * the generator stays usable without it — a lesson with no clip is the lesson we shipped
   * before, not a broken one.
   */
  championId?: number;
}

/**
 * The lesson for one champion in one role, or null when the analysis cannot support one.
 * Returning null is the important half: an analysis that came back thin would otherwise
 * produce a lesson with unanswerable drills, and it would still be graded and still pay XP.
 */
export function buildChampionLesson({
  champion,
  role,
  analysis,
  championId,
}: ChampionLessonInput): Lesson | null {
  const tier = buildTierDrill(champion, analysis);
  const matchup = buildMatchupDrill(champion, analysis);
  if (!tier || !matchup) return null;

  const bans = buildBanDrill(champion, analysis);
  const drills: Drill[] = bans ? [tier, matchup, bans] : [tier, matchup];
  const hardest = analysis.matchupTierList.hard.find((m) => usable(m.opponent))?.opponent ?? null;

  return {
    slug: `${championSlug(champion)}-${role}`,
    trackId: CHAMPION_TRACK_ID,
    title: `Mastering ${champion}`,
    summary: `Where ${champion} sits in the current patch, the ${ROLE_LABEL[role]} lanes you are favoured in, the ones you are not, and the plan for each of them.`,
    minutes: 6,
    access: "pro",
    objectives: [
      `Name the ${ROLE_LABEL[role]} matchups ${champion} actually loses, before champion select`,
      `Play each hard lane by its own plan rather than by the one that works elsewhere`,
      `Fight on ${champion}'s power spikes instead of on your cooldowns`,
    ],
    // Deliberately empty. A champion lesson does not claim to fix a habit the detector raised,
    // and it is not in the registry, so nothing routes a leak here.
    fixes: [],
    blocks: buildBlocks({ champion, role, analysis, championId, drills }),
    drills,
    assignment: assignment(champion, role, hardest),
  };
}

interface BlockInput extends ChampionLessonInput {
  drills: Drill[];
}

function buildBlocks({ champion, role, analysis, championId, drills }: BlockInput): LessonBlock[] {
  const { metaRating, matchupTierList, laneStrategies, hiddenMechanics, powerSpikes } = analysis;
  const hard = matchupTierList.hard.filter((m) => usable(m.opponent) && usable(m.keyTip, 20));

  const blocks: LessonBlock[] = [
    {
      kind: "prose",
      text: `This lesson is about the champion you actually play. Everything below is read from a current analysis of ${champion} in ${ROLE_LABEL[role]} — which lanes go your way, which do not, and what each of them asks of you. The curriculum teaches the game; this teaches the twenty games a week you spend on one champion.`,
    },
  ];

  if (usable(metaRating.reasoning, 20)) {
    blocks.push({
      kind: "keyPoint",
      title: `Where ${champion} sits this patch — ${metaRating.assessment}, ${metaRating.score}/10`,
      text: usable(metaRating.patchContext, 15)
        ? `${metaRating.reasoning} ${metaRating.patchContext}`
        : metaRating.reasoning,
    });
  }

  // Riot's own preview of the ultimate, before the gate on purpose: it is a public asset, it
  // costs us no bandwidth, and the free half of a champion lesson is the half that has to make
  // someone want the rest. The power spike the whole lesson argues about is the one on screen.
  if (championId !== undefined) {
    blocks.push({
      kind: "clip",
      caption: `${champion} — ultimate`,
      championId,
      championName: champion,
      slot: "R1",
      note: `This is the spike the rest of the lesson keeps pointing at, and it is also what the enemy sees a moment before it lands. Watch what it commits: the range you have to be inside, and how long ${champion} is standing still to use it.`,
    });
  }

  blocks.push({ kind: "drill", drillId: drills[0].id });
  blocks.push({ kind: "gate" });

  if (hard.length > 0) {
    blocks.push({
      kind: "table",
      caption: "The lanes that go wrong, and what each one wants",
      head: ["Opponent", "The plan"],
      rows: hard.slice(0, 5).map((m) => [m.opponent, m.keyTip]),
    });
  }

  if (laneStrategies.filter((s) => usable(s, 15)).length > 0) {
    blocks.push({
      kind: "checklist",
      title: `How a ${champion} lane is supposed to go`,
      items: laneStrategies.filter((s) => usable(s, 15)).slice(0, 5),
    });
  }

  blocks.push({ kind: "drill", drillId: drills[1].id });

  if (hiddenMechanics.filter((m) => usable(m, 15)).length > 0) {
    blocks.push({
      kind: "checklist",
      title: "Things most players on this champion never learn",
      items: hiddenMechanics.filter((m) => usable(m, 15)).slice(0, 5),
    });
  }

  const spikes = powerSpikes.filter((s) => usable(s.trigger) && usable(s.description, 15));
  if (spikes.length > 0) {
    blocks.push({
      kind: "table",
      caption: "The moments you are allowed to fight",
      head: ["Spike", "What it changes"],
      rows: spikes.slice(0, 5).map((s) => [s.trigger, s.description]),
    });
  }

  blocks.push({
    kind: "mistake",
    title: "Playing every lane the same way",
    text: `The plan that wins ${champion}'s good lanes is the plan that loses the bad ones. Most games on a champion you know well are lost in the first three minutes of a matchup you have played a hundred times — the same opener, the same level-two walk-up, against the one opponent it does not work on.`,
    fix: hard[0]
      ? `Name the matchup at champion select and pick the plan before the game starts. Against ${hard[0].opponent}, that plan is: ${hard[0].keyTip}`
      : "Name the matchup at champion select and pick the plan before the game starts, rather than finding out at level three which lane this is.",
  });

  if (drills[2]) blocks.push({ kind: "drill", drillId: drills[2].id });

  return blocks;
}
