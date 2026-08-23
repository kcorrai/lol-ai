import { describe, expect, it } from "vitest";
import type { OtpAnalysis, OtpMatchupEntry } from "@/domains/otp";
import { buildChampionLesson, championLessonId, championSlug } from "./championLesson";
import { isChoiceDrill, type Lesson } from "./types";

function matchup(opponent: string, difficulty: OtpMatchupEntry["difficulty"]): OtpMatchupEntry {
  return {
    opponent,
    difficulty,
    summary: `${opponent} wants the lane to be short and violent, and punishes a slow start.`,
    keyTip: `Hold your escape for their engage and take the trade after it is gone, not before.`,
  };
}

function analysis(overrides: Partial<OtpAnalysis> = {}): OtpAnalysis {
  return {
    champion: "Ahri",
    role: "MIDDLE",
    matchupTierList: {
      easy: [matchup("Lux", "easy"), matchup("Veigar", "easy"), matchup("Ziggs", "easy")],
      medium: [
        matchup("Orianna", "medium"),
        matchup("Syndra", "medium"),
        matchup("Azir", "medium"),
      ],
      hard: [matchup("Zed", "hard"), matchup("Fizz", "hard"), matchup("Yasuo", "hard")],
    },
    banPriority: [
      {
        champion: "Zed",
        priority: 2,
        reason: "Kills you through the charm window after level six.",
      },
      {
        champion: "Fizz",
        priority: 1,
        reason: "Ignores your only escape and out-trades every wave.",
      },
      {
        champion: "Yasuo",
        priority: 3,
        reason: "Blocks the poke that the whole lane is built on.",
      },
    ],
    hiddenMechanics: [
      "The charm applies before the projectile finishes travelling, which matters at max range.",
    ],
    powerSpikes: [
      {
        trigger: "Level 6",
        description: "Three dashes turn a lost trade into a kill on anybody below half.",
      },
    ],
    laneStrategies: ["Push the first three waves and take the level-two advantage into a roam."],
    metaRating: {
      score: 7,
      assessment: "Strong",
      reasoning: "Rewards players who can leave the lane, which is most of what mid lane is for.",
      patchContext: "Unchanged for four patches, so the matchup table is stable.",
    },
    generatedAt: "2026-08-18T00:00:00.000Z",
    ...overrides,
  };
}

function build(over: Partial<OtpAnalysis> = {}): Lesson | null {
  return buildChampionLesson({ champion: "Ahri", role: "mid", analysis: analysis(over) });
}

describe("champion lesson ids", () => {
  it("strips everything a URL cannot carry out of a champion name", () => {
    expect(championSlug("Kai'Sa")).toBe("kaisa");
    expect(championSlug("Lee Sin")).toBe("leesin");
    expect(championSlug("Dr. Mundo")).toBe("drmundo");
  });

  it("keys a lesson by champion and role, since the same champion is a different lesson elsewhere", () => {
    expect(championLessonId("Kai'Sa", "adc")).toBe("champion/kaisa-adc");
    expect(championLessonId("Kai'Sa", "mid")).toBe("champion/kaisa-mid");
  });
});

// The same rules `curriculum.test.ts` enforces over the authored curriculum, applied to content
// nobody wrote. This is the whole reason the generator is a pure function (ADR-030).
describe("generated lessons keep the curriculum contract", () => {
  const lesson = build()!;

  it("builds a lesson at all", () => {
    expect(lesson).not.toBeNull();
  });

  it("resolves every drill block to a drill on the same lesson, and no more", () => {
    const declared = new Set(lesson.drills.map((d) => d.id));
    const referenced = lesson.blocks
      .filter((b) => b.kind === "drill")
      .map((b) => (b.kind === "drill" ? b.drillId : ""));

    for (const id of referenced) expect(declared.has(id)).toBe(true);
    expect(referenced.length).toBe(lesson.drills.length);
  });

  it("gives every drill a unique id", () => {
    const ids = lesson.drills.map((d) => d.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every choice drill exactly one correct option, and explains all of them", () => {
    for (const drill of lesson.drills) {
      if (!isChoiceDrill(drill)) continue;
      expect(drill.options.filter((o) => o.correct)).toHaveLength(1);
      for (const option of drill.options) expect(option.explain.length).toBeGreaterThan(20);
    }
  });

  it("orders the ban drill over exactly its own items", () => {
    for (const drill of lesson.drills) {
      if (drill.kind !== "order") continue;
      expect([...drill.correctOrder].sort()).toEqual(drill.items.map((i) => i.id).sort());
    }
  });

  it("puts exactly one gate in it, because it is a pro lesson", () => {
    expect(lesson.access).toBe("pro");
    expect(lesson.blocks.filter((b) => b.kind === "gate")).toHaveLength(1);
  });

  it("gives it objectives and a measurable assignment", () => {
    expect(lesson.objectives.length).toBeGreaterThan(0);
    expect(lesson.assignment.games).toBeGreaterThan(0);
    expect(lesson.assignment.instruction.length).toBeGreaterThan(20);
  });

  // It is generated per player and per champion, so it must never look like a leak's fix.
  it("claims to fix no leak", () => {
    expect(lesson.fixes).toEqual([]);
  });
});

describe("what the drills teach", () => {
  it("ranks the bans by their stated priority rather than the order they arrived in", () => {
    const drill = build()!.drills.find((d) => d.kind === "order")!;
    expect(drill.kind === "order" && drill.correctOrder).toEqual(["fizz", "zed", "yasuo"]);
  });

  it("makes every wrong plan a real plan for a different opponent", () => {
    const drill = build()!.drills.find((d) => d.kind === "decision")!;
    if (drill.kind !== "decision") throw new Error("expected a decision drill");

    for (const option of drill.options.filter((o) => !o.correct)) {
      expect(option.explain).toMatch(/That is the plan for \w+/);
    }
  });

  it("asks the tier drill about a lane the champion is actually favoured in", () => {
    const drill = build()!.drills.find((d) => d.id === "champion-tier")!;
    if (!isChoiceDrill(drill)) throw new Error("expected a choice drill");
    expect(drill.options.find((o) => o.correct)?.label).toBe("Lux");
  });
});

describe("refusing to generate", () => {
  it("returns null when there are not enough hard matchups to ask about", () => {
    expect(build({ matchupTierList: { ...analysis().matchupTierList, hard: [] } })).toBeNull();
  });

  it("returns null when the analysis came back with no summaries to explain with", () => {
    const stripped = analysis().matchupTierList.hard.map((m) => ({ ...m, summary: "" }));
    expect(
      build({ matchupTierList: { ...analysis().matchupTierList, hard: stripped } })
    ).toBeNull();
  });

  // A thin ban list is not a reason to withhold the matchup half, which is the valuable one.
  it("drops the ban drill rather than the lesson when there is nothing to rank", () => {
    const lesson = build({ banPriority: [] })!;
    expect(lesson).not.toBeNull();
    expect(lesson.drills.some((d) => d.kind === "order")).toBe(false);
    expect(lesson.blocks.filter((b) => b.kind === "drill")).toHaveLength(lesson.drills.length);
  });

  it("leaves out a section the analysis had nothing for, without breaking the lesson", () => {
    const lesson = build({ powerSpikes: [], hiddenMechanics: [], laneStrategies: [] })!;
    expect(lesson.blocks.filter((b) => b.kind === "checklist")).toHaveLength(0);
    expect(lesson.blocks.filter((b) => b.kind === "drill")).toHaveLength(lesson.drills.length);
  });
});

describe("the assignment", () => {
  it("asks a support for vision and a laner for CS, because that is what their games produce", () => {
    const support = buildChampionLesson({
      champion: "Thresh",
      role: "support",
      analysis: analysis(),
    });
    const adc = buildChampionLesson({ champion: "Jinx", role: "adc", analysis: analysis() });

    expect(support?.assignment.metric).toBe("visionScore");
    expect(adc?.assignment.metric).toBe("csPerMinute");
  });

  it("names the champion the games have to be played on", () => {
    expect(build()!.assignment.instruction).toContain("Ahri");
  });
});

describe("the ability clip", () => {
  it("is left out when nobody passed a champion key", () => {
    expect(build()!.blocks.filter((b) => b.kind === "clip")).toHaveLength(0);
  });

  it("shows the ultimate, once, for the champion it was given", () => {
    const lesson = buildChampionLesson({
      champion: "Ahri",
      role: "mid",
      analysis: analysis(),
      championId: 103,
    })!;

    const clips = lesson.blocks.filter((b) => b.kind === "clip");
    expect(clips).toHaveLength(1);
    expect(clips[0]).toMatchObject({ championId: 103, championName: "Ahri", slot: "R1" });
  });

  // Riot's asset, Riot's bandwidth — so it belongs to the half of the lesson that has to make
  // somebody want the other half.
  it("sits in front of the gate", () => {
    const lesson = buildChampionLesson({
      champion: "Ahri",
      role: "mid",
      analysis: analysis(),
      championId: 103,
    })!;

    const clip = lesson.blocks.findIndex((b) => b.kind === "clip");
    const gate = lesson.blocks.findIndex((b) => b.kind === "gate");
    expect(clip).toBeGreaterThanOrEqual(0);
    expect(clip).toBeLessThan(gate);
  });
});
