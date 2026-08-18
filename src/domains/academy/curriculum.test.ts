import { describe, expect, it } from "vitest";
import {
  TRACKS,
  allLessons,
  getLesson,
  getLessonById,
  getTrack,
  isGated,
  lessonId,
  lessonNeighbours,
  lessonsForLeak,
  trackCompletion,
  trackMinutes,
  visibleBlocks,
  visibleDrills,
} from "./curriculum";
import { isChoiceDrill, type LessonStatus, type WaveSimDrill } from "./types";
import { meetsGoal, simulateWave, WAVE_ACTIONS, type WaveAction } from "./drills/waveSim";

/** Every plan the player could type, played out — true if any of them reaches the goal. */
function solvable(drill: WaveSimDrill): boolean {
  const plans: WaveAction[][] = [[]];
  for (let cycle = 0; cycle < drill.cycles; cycle += 1) {
    const grown: WaveAction[][] = [];
    for (const plan of plans) for (const action of WAVE_ACTIONS) grown.push([...plan, action]);
    plans.length = 0;
    plans.push(...grown);
  }

  return plans.some((plan) => {
    const states = simulateWave(drill.start, plan);
    return meetsGoal(states[states.length - 1], drill.goal);
  });
}

describe("curriculum integrity", () => {
  it("gives every lesson a globally unique id", () => {
    const ids = allLessons().map(lessonId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("declares each lesson under the track that actually holds it", () => {
    for (const track of TRACKS) {
      for (const lesson of track.lessons) {
        expect(lesson.trackId).toBe(track.id);
      }
    }
  });

  // Every `drill` block must resolve, or a lesson renders a hole where a drill should be.
  it("resolves every drill block to a drill on the same lesson", () => {
    for (const lesson of allLessons()) {
      const declared = new Set(lesson.drills.map((d) => d.id));
      const referenced = lesson.blocks
        .filter((b) => b.kind === "drill")
        .map((b) => (b.kind === "drill" ? b.drillId : ""));

      for (const id of referenced) expect(declared.has(id)).toBe(true);
      expect(referenced.length).toBe(lesson.drills.length);
    }
  });

  it("gives every choice drill exactly one correct option", () => {
    for (const lesson of allLessons()) {
      for (const drill of lesson.drills) {
        if (!isChoiceDrill(drill)) continue;
        expect(drill.options.filter((o) => o.correct)).toHaveLength(1);
      }
    }
  });

  it("explains every option, including the wrong ones", () => {
    for (const lesson of allLessons()) {
      for (const drill of lesson.drills) {
        if (!isChoiceDrill(drill)) continue;
        for (const option of drill.options) expect(option.explain.length).toBeGreaterThan(20);
      }
    }
  });

  // A spot outside the box is unclickable, and one the size of the map is unmissable.
  it("keeps every map spot inside the map and small enough to aim at", () => {
    for (const lesson of allLessons()) {
      for (const drill of lesson.drills) {
        if (drill.kind !== "map") continue;
        for (const { at } of drill.options) {
          expect(at.x).toBeGreaterThanOrEqual(0);
          expect(at.x).toBeLessThanOrEqual(1);
          expect(at.y).toBeGreaterThanOrEqual(0);
          expect(at.y).toBeLessThanOrEqual(1);
          expect(at.r).toBeGreaterThan(0);
          expect(at.r).toBeLessThanOrEqual(0.15);
        }
      }
    }
  });

  // Content, not code, decides the starting wave and how many cycles the player gets — so the
  // contract has to prove the puzzle can actually be solved in them. Brute force is affordable
  // because a wave-sim drill is a handful of cycles by design.
  it("leaves every wave-sim drill solvable inside its own cycles", () => {
    for (const lesson of allLessons()) {
      for (const drill of lesson.drills) {
        if (drill.kind !== "wave-sim") continue;
        expect(drill.cycles).toBeLessThanOrEqual(5);
        expect(solvable(drill)).toBe(true);
      }
    }
  });

  it("orders every order drill over exactly its own items", () => {
    for (const lesson of allLessons()) {
      for (const drill of lesson.drills) {
        if (drill.kind !== "order") continue;
        expect([...drill.correctOrder].sort()).toEqual(drill.items.map((i) => i.id).sort());
      }
    }
  });

  // A pro lesson without a gate would either be fully public or fully hidden.
  it("puts a gate in every pro lesson and none in a free one", () => {
    for (const lesson of allLessons()) {
      const gates = lesson.blocks.filter((b) => b.kind === "gate").length;
      expect(gates).toBe(lesson.access === "pro" ? 1 : 0);
    }
  });

  it("opens every track with a free lesson", () => {
    for (const track of TRACKS) {
      expect(track.lessons[0].access).toBe("free");
    }
  });

  it("gives every lesson objectives and a field assignment", () => {
    for (const lesson of allLessons()) {
      expect(lesson.objectives.length).toBeGreaterThan(0);
      expect(lesson.assignment.games).toBeGreaterThan(0);
      expect(lesson.assignment.instruction.length).toBeGreaterThan(20);
    }
  });
});

describe("lookup", () => {
  it("finds a track and a lesson by slug", () => {
    expect(getTrack("foundations")?.title).toBe("Foundations");
    expect(getLesson("foundations", "minions-and-gold")?.slug).toBe("minions-and-gold");
  });

  it("returns null for anything unknown", () => {
    expect(getTrack("nope")).toBeNull();
    expect(getLesson("foundations", "nope")).toBeNull();
    expect(getLessonById("nope")).toBeNull();
    expect(getLessonById("foundations")).toBeNull();
  });

  it("round-trips a lesson through its id", () => {
    const lesson = allLessons()[3];
    expect(getLessonById(lessonId(lesson))).toBe(lesson);
  });
});

describe("navigation", () => {
  it("has no previous on the first lesson and no next on the last", () => {
    const track = getTrack("laning")!;
    const first = lessonNeighbours(track.lessons[0]);
    const last = lessonNeighbours(track.lessons[track.lessons.length - 1]);

    expect(first.previous).toBeNull();
    expect(first.next).toBe(track.lessons[1]);
    expect(first.index).toBe(1);
    expect(last.next).toBeNull();
    expect(last.index).toBe(track.lessons.length);
  });

  it("sums track reading time", () => {
    const track = getTrack("foundations")!;
    expect(trackMinutes(track)).toBe(track.lessons.reduce((s, l) => s + l.minutes, 0));
  });
});

describe("progress", () => {
  it("counts completed and mastered lessons, and nothing else", () => {
    const track = getTrack("foundations")!;
    const statuses = new Map<string, LessonStatus>([
      [lessonId(track.lessons[0]), "completed"],
      [lessonId(track.lessons[1]), "mastered"],
      [lessonId(track.lessons[2]), "in_progress"],
    ]);

    expect(trackCompletion(track, statuses)).toBeCloseTo(2 / track.lessons.length);
  });

  it("is zero with no progress at all", () => {
    expect(trackCompletion(getTrack("laning")!, new Map())).toBe(0);
  });
});

describe("gating", () => {
  const proLesson = getLesson("laning", "freezing")!;
  const freeLesson = getLesson("foundations", "minions-and-gold")!;

  it("cuts a pro lesson at the gate for a visitor without pro", () => {
    const gated = visibleBlocks(proLesson, false);
    const full = visibleBlocks(proLesson, true);

    expect(gated.length).toBeLessThan(full.length);
    expect(gated.some((b) => b.kind === "gate")).toBe(false);
    expect(isGated(proLesson, false)).toBe(true);
  });

  it("never strips the gate marker itself from the full view", () => {
    expect(visibleBlocks(proLesson, true).some((b) => b.kind === "gate")).toBe(false);
  });

  it("leaves a free lesson whole for everyone", () => {
    expect(visibleBlocks(freeLesson, false)).toEqual(visibleBlocks(freeLesson, true));
    expect(isGated(freeLesson, false)).toBe(false);
  });

  it("only offers drills that appear in the visible half", () => {
    const gated = visibleDrills(proLesson, false);
    expect(gated.length).toBeLessThan(proLesson.drills.length);
    expect(visibleDrills(proLesson, true)).toHaveLength(proLesson.drills.length);
  });
});

describe("leak mapping", () => {
  it("returns lessons in teaching order for a detected leak", () => {
    const lessons = lessonsForLeak("low_cs");
    expect(lessons.length).toBeGreaterThan(0);
    expect(lessons.map(lessonId)).toEqual(
      allLessons()
        .filter((l) => l.fixes.includes("low_cs"))
        .map(lessonId)
    );
  });

  // Every habit habitDetectionService can raise needs somewhere to send the player. All six
  // are covered now that Macro answers `late_game_throw` and Mental answers `tilt_prone`.
  it("covers the leaks the habit detector actually raises", () => {
    for (const leak of [
      "low_cs",
      "low_vision",
      "high_deaths",
      "objective_neglect",
      "late_game_throw",
      "tilt_prone",
    ] as const) {
      expect(lessonsForLeak(leak).length).toBeGreaterThan(0);
    }
  });
});
